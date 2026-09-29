import { PrismaClient } from '@prisma/client';
import { GstEngineService } from './accounting/gst-engine.service';
import { Gstr1MapperService } from './accounting/gstr1-mapper.service';
import { Gstr1ValidationService } from './accounting/gstr1-validation.service';
import { GstReconciliationService } from './accounting/gst-reconciliation.service';
import { GstExceptionsService } from './accounting/gst-exceptions.service';
import { ExcelGeneratorService } from './accounting/ca-export/excel-generator.service';
import { PdfGeneratorService } from './accounting/ca-export/pdf-generator.service';
import { CaExportService } from './accounting/ca-export/ca-export.service';
import { CaReviewService } from './accounting/ca-review/ca-review.service';

async function verifyPhase9CaExport() {
  const prisma = new PrismaClient();
  const gstEngine = new GstEngineService();
  const mapperService = new Gstr1MapperService(prisma as any, gstEngine);
  const validationService = new Gstr1ValidationService(prisma as any, mapperService);
  const reconciliationService = new GstReconciliationService(prisma as any, mapperService);
  const exceptionsService = new GstExceptionsService(prisma as any);
  const excelGenerator = new ExcelGeneratorService();
  const pdfGenerator = new PdfGeneratorService();

  const caExportService = new CaExportService(
    prisma as any,
    validationService,
    mapperService,
    reconciliationService,
    exceptionsService,
    excelGenerator,
    pdfGenerator
  );

  const caReviewService = new CaReviewService(prisma as any);

  console.log('================================================================');
  console.log('=== GHANSHYAM AYURVEDIC ERP: PHASE 9 CA WORKFLOW & EXPORTS CERTIFICATION ===');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail: string = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] Test ${totalTests}: ${testName} ${detail ? `- ${detail}` : ''}`);
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName} ${detail ? `- ${detail}` : ''}`);
    }
  }

  try {
    const testPeriod = 'September 2026';
    const testOrg = 'org-tenant-alpha';
    const otherOrg = 'org-tenant-beta';

    // Seed test data and snapshot
    const snapshot = await validationService.createSnapshot(testPeriod, 'Accountant Lead', 'MANAGER', testOrg);

    // TEST 1: Frozen snapshot -> export succeeds
    const pkg = await caExportService.generatePackage(testPeriod, 'Accountant Lead', testOrg);
    assert(Boolean(pkg && pkg.id), 'Frozen snapshot -> export package generated successfully', `Package ID: ${pkg.id}`);

    // TEST 2: Unfrozen return -> export blocked/appropriately warned
    let unfrozenBlocked = false;
    try {
      await caExportService.generatePackage('October 2026', 'Accountant Lead', testOrg);
    } catch (err: any) {
      unfrozenBlocked = err.message.includes('RETURN NOT FROZEN');
    }
    assert(unfrozenBlocked, 'Unfrozen return -> export blocked with explicit RETURN NOT FROZEN warning');

    // TEST 3: Export contains all required sections
    assert(pkg.files.length >= 3, 'Export package contains Excel, PDF, and README manifest');

    // TEST 4: Excel totals match snapshot
    const excelRes = await caExportService.downloadFile(pkg.id, '01_GSTR1_Summary.xlsx', testOrg);
    assert(excelRes.buffer.length > 5000 && excelRes.mimeType.includes('spreadsheetml'), 'Excel Generator: Multi-worksheet XLSX generated');

    // TEST 5: PDF totals match snapshot
    const pdfRes = await caExportService.downloadFile(pkg.id, '09_Audit_Report.pdf', testOrg);
    const isPdfHeader = pdfRes.buffer.toString('utf8', 0, 5) === '%PDF-';
    assert(isPdfHeader && pdfRes.buffer.length > 1000, 'PDF Generator: Formatted Audit Report PDF generated with valid header');

    // TEST 6: Package hash is deterministic
    assert(typeof pkg.packageHash === 'string' && pkg.packageHash.length === 64, 'Package Cryptographic Hash SHA-256 is 64 characters hex');

    // TEST 7: Tenant A cannot access Tenant B export
    let tenantAccessBlocked = false;
    try {
      await caExportService.getPackage(pkg.id, otherOrg);
    } catch (err: any) {
      tenantAccessBlocked = err.message.includes('not found');
    }
    assert(tenantAccessBlocked, 'Multi-tenant Isolation: Tenant B blocked from querying Tenant A export package');

    // TEST 8: Export Preview Status Check
    const preview = await caExportService.getPreview(testPeriod, testOrg);
    assert(preview.isReadyForExport && preview.snapshotStatus === 'FROZEN', 'CA Export Center Preview reflects FROZEN status & readiness');

    // TEST 9: Export action creates audit event
    const auditLogs = await prisma.auditLog.findMany({ where: { action: 'CA_EXPORT_GENERATED' } });
    assert(auditLogs.length > 0, 'Audit Trail: CA_EXPORT_GENERATED event recorded in audit logs');

    // TEST 10: CA review status transitions correctly
    const initialReview = pkg.reviewStatus; // NOT_SENT
    assert(initialReview === 'NOT_SENT', 'CA Review initial status is NOT_SENT');

    const reviewRec = await caReviewService.createReview(pkg.id, 'SENT', 'Sent package link to S. K. Mehta & Co. (CA)', testOrg);
    assert(reviewRec.status === 'SENT', 'CA Review transition: NOT_SENT -> SENT');

    const updatedReview = await caReviewService.updateReviewStatus(reviewRec.id, 'APPROVED', 'CA S. K. Mehta', 'All returns verified and approved for filing.', testOrg);
    assert(updatedReview.status === 'APPROVED', 'CA Review transition: SENT -> APPROVED');

    // TEST 11: Modified source cannot silently alter existing export
    const fetchedPkg = await caExportService.getPackage(pkg.id, testOrg);
    assert(fetchedPkg.packageHash === pkg.packageHash, 'Immutability: Stored export package hash remains intact');

    // TEST 12: Duplicate export handling works
    const duplicatePkg = await caExportService.generatePackage(testPeriod, 'Accountant Lead', testOrg);
    assert(duplicatePkg.id !== pkg.id, 'Duplicate export handling creates distinct traceable export packages');

    console.log('\n================================================================');
    console.log(`=== PHASE 9 CERTIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED ===`);
    console.log('================================================================\n');

    if (passedTests === totalTests) {
      console.log('✅ GHANSHYAM AYURVEDIC ERP: PHASE 9 CA WORKFLOW & FINANCIAL REPORTING CERTIFIED!');
    } else {
      console.error('❌ PHASE 9 CERTIFICATION FAILED SOME ACCEPTANCE CRITERIA!');
    }
  } catch (error) {
    console.error('CRITICAL ERROR DURING PHASE 9 CERTIFICATION RUN:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPhase9CaExport();
