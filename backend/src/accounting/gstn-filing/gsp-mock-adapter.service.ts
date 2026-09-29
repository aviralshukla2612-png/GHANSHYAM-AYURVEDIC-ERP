import { Injectable, Logger } from '@nestjs/common';
import { IGspAdapter } from './gsp-adapter.interface';
import { GspSubmissionResponse, GspStatusResponse, GstnGstr1Payload } from './gstn-filing.types';
import { createHash } from 'crypto';

@Injectable()
export class GspMockAdapterService implements IGspAdapter {
  private readonly logger = new Logger(GspMockAdapterService.name);
  private submissionDb: Map<string, { status: 'PROCESSING' | 'ACCEPTED' | 'REJECTED'; arn?: string; errorCode?: string; errorMessage?: string }> = new Map();

  async authenticate(gstin: string, username: string = 'ghanshyam_gst'): Promise<{ success: boolean; authHeader: string; expiresAt: Date }> {
    const authHeader = `Bearer gsp_token_${createHash('md5').update(`${gstin}_${Date.now()}`).digest('hex')}`;
    const expiresAt = new Date(Date.now() + 6 * 3600 * 1000); // 6 Hours Validity
    this.logger.log(`[GSP Mock] Authenticated GSTIN '${gstin}' successfully.`);
    return { success: true, authHeader, expiresAt };
  }

  async submitGstr1Payload(
    gstin: string,
    period: string,
    payload: GstnGstr1Payload,
    authHeader: string
  ): Promise<GspSubmissionResponse> {
    const referenceId = `REF-GSTN-${period}-${Date.now()}`;
    
    // Simulate immediate GSTN rejection test case if test payload contains invalid marker
    if (payload.gt < 0) {
      this.submissionDb.set(referenceId, {
        status: 'REJECTED',
        errorCode: 'RET0001',
        errorMessage: 'Invalid Gross Turnover value in payload header.',
      });
      return {
        success: false,
        referenceId,
        status: 'SUBMISSION_FAILED',
        errorCode: 'RET0001',
        errorMessage: 'Invalid Gross Turnover value in payload header.',
        submittedAt: new Date().toISOString(),
      };
    }

    // Default successful submission queued for GSTN processing
    const generatedArn = `AA${pincodePrefix(gstin)}${period.replace(/[^0-9]/g, '')}${Math.floor(100000 + Math.random() * 900000)}`;
    this.submissionDb.set(referenceId, {
      status: 'ACCEPTED',
      arn: generatedArn,
    });

    this.logger.log(`[GSP Mock] Submitted GSTR-1 payload for ${gstin} (${period}). Ref: ${referenceId}`);
    return {
      success: true,
      referenceId,
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
    };
  }

  async pollFilingStatus(gstin: string, period: string, referenceId: string, authHeader: string): Promise<GspStatusResponse> {
    const record = this.submissionDb.get(referenceId);
    if (!record) {
      return {
        referenceId,
        status: 'REJECTED',
        errorCode: 'RET9999',
        errorMessage: `Reference ID '${referenceId}' not found on GSTN server.`,
      };
    }

    return {
      referenceId,
      status: record.status,
      arn: record.arn,
      errorCode: record.errorCode,
      errorMessage: record.errorMessage,
      completedAt: new Date().toISOString(),
    };
  }
}

function pincodePrefix(gstin: string): string {
  const prefix = gstin ? gstin.slice(0, 2) : '24';
  return prefix.length === 2 ? prefix : '24';
}
