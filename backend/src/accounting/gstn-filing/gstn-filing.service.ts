import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Gstr1ValidationService } from '../gstr1-validation.service';
import { GstnPayloadMapperService } from './gstn-payload-mapper.service';
import { GstnSchemaValidatorService } from './gstn-schema-validator.service';
import { GspMockAdapterService } from './gsp-mock-adapter.service';
import { GstnFilingLifecycleStatus, GstnGstr1Payload } from './gstn-filing.types';
import { createHash } from 'crypto';

@Injectable()
export class GstnFilingService {
  constructor(
    private prisma: PrismaService,
    private validationService: Gstr1ValidationService,
    private payloadMapper: GstnPayloadMapperService,
    private schemaValidator: GstnSchemaValidatorService,
    private gspAdapter: GspMockAdapterService
  ) {}

  // 1. Prepare Filing Package from Frozen Snapshot
  async prepareFiling(period: string = 'September 2026', organizationId: string = 'org-default') {
    const snapshots = await this.validationService.getSnapshots(period, organizationId);
    const snapshot = snapshots[0];

    if (!snapshot || snapshot.status !== 'FROZEN') {
      throw new BadRequestException(
        `RETURN NOT FROZEN: Snapshot for period '${period}' must be frozen before preparing GSTN filing payload.`
      );
    }

    // CRITICAL RULE: Map payload from FROZEN snapshot, NOT live mutable sales data!
    const gstnPayload = this.payloadMapper.mapSnapshotToGstnPayload(snapshot);
    const schemaResult = this.schemaValidator.validateGstnPayload(gstnPayload);
    const payloadHash = createHash('sha256').update(JSON.stringify(gstnPayload)).digest('hex');

    return {
      period,
      snapshotId: snapshot.id,
      snapshotStatus: snapshot.status,
      status: (schemaResult.isValid ? 'READY_TO_FILE' : 'VALIDATION_FAILED') as GstnFilingLifecycleStatus,
      schemaResult,
      payloadHash,
      gstnPayload,
    };
  }

  // 2. Submit Filing Package to GSTN via GSP Adapter
  async submitFiling(period: string = 'September 2026', userId: string = 'System Accountant', organizationId: string = 'org-default') {
    const prep = await this.prepareFiling(period, organizationId);

    if (prep.status === 'VALIDATION_FAILED') {
      await this.prisma.gstnFilingHistory.create({
        data: {
          organizationId,
          period,
          snapshotId: prep.snapshotId,
          status: 'VALIDATION_FAILED',
          submittedBy: userId,
          errorCode: 'SCHEMA_INVALID',
          errorMessage: prep.schemaResult.errors.join(' | '),
          payloadHash: prep.payloadHash,
          gstnPayload: JSON.stringify(prep.gstnPayload),
        },
      });
      throw new BadRequestException(`GSTN Schema Validation Failed: ${prep.schemaResult.errors.join(' | ')}`);
    }

    // Authenticate with GSP
    const auth = await this.gspAdapter.authenticate(prep.gstnPayload.gstin);
    
    // Submit to GSP Adapter
    const gspRes = await this.gspAdapter.submitGstr1Payload(prep.gstnPayload.gstin, period, prep.gstnPayload, auth.authHeader);

    const filingStatus: GstnFilingLifecycleStatus = gspRes.success ? 'SUBMITTED' : 'SUBMISSION_FAILED';

    const filingRecord = await this.prisma.gstnFilingHistory.create({
      data: {
        organizationId,
        period,
        snapshotId: prep.snapshotId,
        status: filingStatus,
        externalRefId: gspRes.referenceId,
        submittedBy: userId,
        submissionTimestamp: new Date(gspRes.submittedAt),
        errorCode: gspRes.errorCode,
        errorMessage: gspRes.errorMessage,
        payloadHash: prep.payloadHash,
        gstnPayload: JSON.stringify(prep.gstnPayload),
      },
    });

    // Record Audit Event
    await this.prisma.auditLog.create({
      data: {
        action: 'GSTR1_FILING_SUBMITTED',
        entity: 'GstnFilingHistory',
        entityId: filingRecord.id,
        newValue: JSON.stringify({
          period,
          snapshotId: prep.snapshotId,
          status: filingStatus,
          externalRefId: gspRes.referenceId,
          user: userId,
          payloadHash: prep.payloadHash,
        }),
      },
    });

    return filingRecord;
  }

  // 3. Poll GSTN Async Status for ARN Assignment
  async pollFilingStatus(filingId: string, organizationId: string = 'org-default') {
    const filing = await this.prisma.gstnFilingHistory.findUnique({ where: { id: filingId } });
    if (!filing) throw new NotFoundException('Filing record not found');
    if (organizationId && filing.organizationId !== organizationId) {
      throw new NotFoundException('Filing record not found for organization');
    }

    if (!filing.externalRefId) {
      return filing;
    }

    const auth = await this.gspAdapter.authenticate('24AAAAG1234H1Z5');
    const statusRes = await this.gspAdapter.pollFilingStatus('24AAAAG1234H1Z5', filing.period, filing.externalRefId, auth.authHeader);

    const newStatus: GstnFilingLifecycleStatus = statusRes.status === 'ACCEPTED' ? 'ACCEPTED' : statusRes.status === 'REJECTED' ? 'REJECTED' : 'PROCESSING';

    const updated = await this.prisma.gstnFilingHistory.update({
      where: { id: filingId },
      data: {
        status: newStatus,
        arn: statusRes.arn || filing.arn,
        errorCode: statusRes.errorCode || filing.errorCode,
        errorMessage: statusRes.errorMessage || filing.errorMessage,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'GSTR1_FILING_STATUS_POLLED',
        entity: 'GstnFilingHistory',
        entityId: filingId,
        newValue: JSON.stringify({ previousStatus: filing.status, newStatus, arn: updated.arn }),
      },
    });

    return updated;
  }

  // 4. Get Filing History
  async getFilingHistory(period?: string, organizationId: string = 'org-default') {
    const where: any = { organizationId };
    if (period) where.period = period;

    const history = await this.prisma.gstnFilingHistory.findMany({
      where,
      orderBy: { submissionTimestamp: 'desc' },
    });

    return history;
  }
}
