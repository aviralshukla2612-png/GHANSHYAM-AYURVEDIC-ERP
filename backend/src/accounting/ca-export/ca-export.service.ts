import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Gstr1ValidationService } from '../gstr1-validation.service';
import { Gstr1MapperService } from '../gstr1-mapper.service';
import { GstReconciliationService } from '../gst-reconciliation.service';
import { GstExceptionsService } from '../gst-exceptions.service';
import { ExcelGeneratorService } from './excel-generator.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { CaExportPreview, CaExportPackageResponse, CaReviewStatus } from './ca-export.types';
import { createHash } from 'crypto';

@Injectable()
export class CaExportService {
  constructor(
    private prisma: PrismaService,
    private validationService: Gstr1ValidationService,
    private mapperService: Gstr1MapperService,
    private reconciliationService: GstReconciliationService,
    private exceptionsService: GstExceptionsService,
    private excelGenerator: ExcelGeneratorService,
    private pdfGenerator: PdfGeneratorService
  ) {}

  // Preview CA Export Center status dashboard
  async getPreview(period: string = 'September 2026', organizationId?: string): Promise<CaExportPreview> {
    const snapshots = await this.validationService.getSnapshots(period, organizationId);
    const snapshot = snapshots[0];
    const exceptions = await this.exceptionsService.getExceptions(period, organizationId);

    const isFrozen = snapshot && snapshot.status === 'FROZEN';
    const isAuditPassed = snapshot && snapshot.validationReport.status === 'READY_FOR_EXPORT';
    const isReconciled = snapshot && snapshot.reconciliationReport.status === 'RECONCILED';

    let isReadyForExport = Boolean(isFrozen && exceptions.criticalCount === 0);
    let warningMessage = undefined;

    if (!snapshot) {
      isReadyForExport = false;
      warningMessage = `No GSTR-1 snapshot found for period ${period}. Freeze snapshot before export.`;
    } else if (!isFrozen) {
      isReadyForExport = false;
      warningMessage = `Snapshot for period ${period} is not FROZEN. Return period must be frozen before generating CA package.`;
    } else if (exceptions.criticalCount > 0) {
      isReadyForExport = false;
      warningMessage = `Period ${period} has ${exceptions.criticalCount} unresolved critical exceptions.`;
    }

    return {
      period,
      snapshotId: snapshot?.id,
      snapshotStatus: isFrozen ? 'FROZEN' : snapshot ? 'DRAFT' : 'NOT_FROZEN',
      auditStatus: isAuditPassed ? 'PASSED' : snapshot?.validationReport.status === 'WARNINGS_PRESENT' ? 'WARNINGS' : 'FAILED',
      reconciliationStatus: isReconciled ? 'RECONCILED' : 'UNEXPLAINED_VARIANCES',
      criticalExceptions: exceptions.criticalCount,
      sourceDataHash: snapshot?.sourceDataHash,
      payloadHash: snapshot?.payloadHash,
      isReadyForExport,
      warningMessage,
    };
  }

  // Generate a Single CA Review Package
  async generatePackage(
    period: string = 'September 2026',
    userId: string = 'System Accountant',
    organizationId: string = 'org-default'
  ): Promise<CaExportPackageResponse> {
    const snapshots = await this.validationService.getSnapshots(period, organizationId);
    const snapshot = snapshots[0];

    if (!snapshot || snapshot.status !== 'FROZEN') {
      throw new BadRequestException(
        `RETURN NOT FROZEN: Snapshot for period '${period}' must be frozen before generating CA review package.`
      );
    }

    const returnData = await this.mapperService.mapGstr1Return(period, organizationId);
    const reconReport = await this.reconciliationService.reconcileInvoiceVsLedger(period);
    const exceptions = await this.exceptionsService.getExceptions(period, organizationId);

    const excelBuffer = await this.excelGenerator.generateCaExcelWorkbook(returnData, reconReport, exceptions);
    const pdfBuffer = await this.pdfGenerator.generateAuditPdfReport(snapshot, snapshot.validationReport, reconReport);

    const readmeContent = `Ghanshyam Ayurvedic Pharmacy - GSTR-1 CA Package
=====================================================
Entity Name:         Ghanshyam Ayurvedic Pharmacy
Return Period:       ${period}
Generated Date:      ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
Snapshot ID:         ${snapshot.id}
Snapshot Status:     ${snapshot.status}
Audit Engine:        ${snapshot.validationReport.status}
Reconciliation:      ${reconReport.status}
Source Data Hash:    ${snapshot.sourceDataHash}
Payload Hash:        ${snapshot.payloadHash}
Critical Exceptions: ${exceptions.criticalCount}
=====================================================
Files Included in Package:
1. 01_GSTR1_Summary.xlsx (Worksheets: Summary, B2B, B2CL, B2CS, Exports, CDNR, HSN B2B, HSN B2C, Documents, Reconciliation, Exceptions)
2. 09_Audit_Report.pdf (Official Formatted Audit & Integrity Certificate)
3. README.txt (Package Specifications)
`;

    // Compute deterministic package hash
    const combinedData = Buffer.concat([excelBuffer, pdfBuffer, Buffer.from(readmeContent)]);
    const packageHash = createHash('sha256').update(combinedData).digest('hex');

    // Create DB records for tenant
    const pkg = await this.prisma.caExportPackage.create({
      data: {
        organizationId,
        period,
        snapshotId: snapshot.id,
        status: 'GENERATED',
        fileCount: 10,
        packageHash,
        readmeContent,
        generatedBy: userId,
        caReviews: {
          create: {
            organizationId,
            status: 'NOT_SENT',
          },
        },
      },
      include: { caReviews: true },
    });

    // Create Export Audit Trail Event
    await this.prisma.auditLog.create({
      data: {
        action: 'CA_EXPORT_GENERATED',
        entity: 'CaExportPackage',
        entityId: pkg.id,
        newValue: JSON.stringify({
          user: userId,
          period,
          snapshotId: snapshot.id,
          filesCount: 10,
          packageHash,
          generatedAt: pkg.generatedAt.toISOString(),
        }),
      },
    });

    const reviewStatus = (pkg.caReviews[0]?.status || 'NOT_SENT') as CaReviewStatus;

    return {
      id: pkg.id,
      organizationId: pkg.organizationId,
      period: pkg.period,
      snapshotId: pkg.snapshotId,
      status: pkg.status,
      fileCount: pkg.fileCount,
      packageHash: pkg.packageHash,
      readmeContent: pkg.readmeContent || '',
      generatedBy: pkg.generatedBy,
      generatedAt: pkg.generatedAt.toISOString(),
      reviewStatus,
      downloadUrl: `/api/accounting/ca-export/${pkg.id}/download`,
      files: [
        { name: '01_GSTR1_Summary.xlsx', type: 'EXCEL', description: 'Complete multi-worksheet Excel workbook' },
        { name: '09_Audit_Report.pdf', type: 'PDF', description: 'Formatted Audit & Reconciliation Certificate' },
        { name: 'README.txt', type: 'TEXT', description: 'Package cryptographic proof & entity details' },
      ],
    };
  }

  // Get single package details
  async getPackage(id: string, organizationId?: string) {
    const pkg = await this.prisma.caExportPackage.findUnique({
      where: { id },
      include: { caReviews: true },
    });

    if (!pkg) throw new NotFoundException('CA Export Package not found');
    if (organizationId && pkg.organizationId !== organizationId) {
      throw new NotFoundException('CA Export Package not found for organization');
    }

    return pkg;
  }

  // Download export package file
  async downloadFile(id: string, fileName: string = '01_GSTR1_Summary.xlsx', organizationId?: string): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const pkg = await this.getPackage(id, organizationId);
    const snapshots = await this.validationService.getSnapshots(pkg.period, pkg.organizationId);
    const snapshot = snapshots[0] || (await this.validationService.createSnapshot(pkg.period, pkg.generatedBy, 'MANAGER', pkg.organizationId));
    const returnData = await this.mapperService.mapGstr1Return(pkg.period, pkg.organizationId);
    const reconReport = await this.reconciliationService.reconcileInvoiceVsLedger(pkg.period);
    const exceptions = await this.exceptionsService.getExceptions(pkg.period, pkg.organizationId);

    if (fileName.endsWith('.pdf')) {
      const buffer = await this.pdfGenerator.generateAuditPdfReport(snapshot, snapshot.validationReport, reconReport);
      return { buffer, mimeType: 'application/pdf', filename: `Ghanshyam-GSTR1-AuditReport-${pkg.period}.pdf` };
    }

    if (fileName.endsWith('.txt')) {
      return { buffer: Buffer.from(pkg.readmeContent || 'README'), mimeType: 'text/plain', filename: 'README.txt' };
    }

    const buffer = await this.excelGenerator.generateCaExcelWorkbook(returnData, reconReport, exceptions);
    return { buffer, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `Ghanshyam-GSTR1-${pkg.period}.xlsx` };
  }
}
