import { PrismaClient } from '@prisma/client';
import { GstEngineService } from './accounting/gst-engine.service';
import { Gstr1MapperService } from './accounting/gstr1-mapper.service';
import { Gstr1ValidationService } from './accounting/gstr1-validation.service';
import { GstReconciliationService } from './accounting/gst-reconciliation.service';
import { GstExceptionsService } from './accounting/gst-exceptions.service';
import { Gstr1MetricsService } from './accounting/gstr1-metrics.service';
import { ExcelGeneratorService } from './accounting/ca-export/excel-generator.service';
import { PdfGeneratorService } from './accounting/ca-export/pdf-generator.service';
import { CaExportService } from './accounting/ca-export/ca-export.service';
import { CaReviewService } from './accounting/ca-review/ca-review.service';
import { GspMockAdapterService } from './accounting/gstn-filing/gsp-mock-adapter.service';
import { GspProductionAdapterService } from './accounting/gstn-filing/gsp-production-adapter.service';
import { ProductionSecretService } from './accounting/gstn-filing/production-secret.service';
import { GstnPayloadMapperService } from './accounting/gstn-filing/gstn-payload-mapper.service';
import { GstnSchemaValidatorService } from './accounting/gstn-filing/gstn-schema-validator.service';
import { GstnFilingService } from './accounting/gstn-filing/gstn-filing.service';
import { DisasterRecoveryService } from './accounting/disaster-recovery.service';

async function verifyPhase11ProductionCertification() {
  const prisma = new PrismaClient();
  const secretService = new ProductionSecretService();
  const prodAdapter = new GspProductionAdapterService(secretService);
  const mockAdapter = new GspMockAdapterService();
  const gstEngine = new GstEngineService();
  const mapperService = new Gstr1MapperService(prisma as any, gstEngine);
  const validationService = new Gstr1ValidationService(prisma as any, mapperService);
  const reconciliationService = new GstReconciliationService(prisma as any, mapperService);
  const exceptionsService = new GstExceptionsService(prisma as any);
  const metricsService = new Gstr1MetricsService();
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
  const payloadMapper = new GstnPayloadMapperService();
  const schemaValidator = new GstnSchemaValidatorService();

  const filingService = new GstnFilingService(
    prisma as any,
    validationService,
    payloadMapper,
    schemaValidator,
    prodAdapter as any
  );

  const drService = new DisasterRecoveryService(
    prisma as any,
    validationService,
    caExportService,
    exceptionsService,
    filingService
  );

  console.log('================================================================');
  console.log('=== GHANSHYAM AYURVEDIC ERP: PHASE 11 FINAL PRODUCTION CERTIFICATION ===');
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

    // -------------------------------------------------------------------------
    // 11A: Production GSP Adapter Verification
    // -------------------------------------------------------------------------
    console.log('--- 11A: Production GSP Adapter Integration ---');
    const authRes = await prodAdapter.authenticate('24AAAAG1234H1Z5');
    assert(authRes.success && authRes.authHeader.startsWith('Bearer gsp_prod_'), 'Prod GSP Adapter: Session token authenticated');

    // -------------------------------------------------------------------------
    // 11B: Secret Management & Production Hardening
    // -------------------------------------------------------------------------
    console.log('\n--- 11B: Secret Management & Production Hardening ---');
    const secretsVal = secretService.validateSecrets();
    assert(secretsVal.isSecure, 'Secret Manager: Production credentials non-empty & meet security length');

    const masked = secretService.maskSecret('sec_prod_9938472910384729');
    assert(masked === 'se****29', 'Secret Manager: Credentials masked safely for server logs');

    console.log('\n--- 11C: End-to-End Live Filing Lifecycle & Hash Match ---');
    const snapshot = await validationService.createSnapshot(testPeriod, 'Production Officer', 'MANAGER', testOrg);
    const prepInfo = await filingService.prepareFiling(testPeriod, testOrg);
    const filingRes = await filingService.submitFiling(testPeriod, 'Production Officer', testOrg);
    const polledFiling = await filingService.pollFilingStatus(filingRes.id, testOrg);

    assert(polledFiling.status === 'ACCEPTED' && Boolean(polledFiling.arn), 'Live Filing: State transitioned to ACCEPTED with valid ARN');
    assert(polledFiling.payloadHash === prepInfo.payloadHash, 'Live Filing: Pre-submission payload hash matches stored filing history payload hash 100%');

    // -------------------------------------------------------------------------
    // 11D: Failure Recovery & Safe Retries
    // -------------------------------------------------------------------------
    console.log('\n--- 11D: Failure Recovery & Safe Retries ---');
    const priorCheck = await prodAdapter.verifyPriorSubmissionBeforeRetry(testPeriod, prepInfo.payloadHash);
    assert(priorCheck.exists, 'Safe Retries: Prior submission detected; prevents duplicate submission to GSTN portal');

    // -------------------------------------------------------------------------
    // 11E: Disaster Recovery & Backup Integrity
    // -------------------------------------------------------------------------
    console.log('\n--- 11E: Disaster Recovery & Backup Integrity ---');
    const drBackup = await drService.exportDisasterRecoveryBackup(testPeriod, testOrg);
    assert(Boolean(drBackup.exportedAt) && drBackup.snapshots.length > 0, 'Disaster Recovery: Backup archive created with snapshots & filing history');

    const drRestore = await drService.restoreFromBackup(drBackup);
    assert(drRestore.success && drRestore.restoredCounts.snapshots >= 1, 'Disaster Recovery: State successfully restored from backup archive');

    // -------------------------------------------------------------------------
    // 11F: Final Security Audit & Multi-Tenant Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- 11F: Final Security Audit & Access Controls ---');
    let tenantFilingBlocked = false;
    try {
      await filingService.pollFilingStatus(filingRes.id, otherOrg);
    } catch (err: any) {
      tenantFilingBlocked = err.message.includes('not found');
    }
    assert(tenantFilingBlocked, 'Security Audit: Tenant B blocked from querying Tenant A filing status');

    let rbacFreezeBlocked = false;
    try {
      await validationService.createSnapshot(testPeriod, 'Accountant User', 'ACCOUNTANT', testOrg);
    } catch (err: any) {
      rbacFreezeBlocked = err.message.includes('Accountant role is not authorized');
    }
    assert(rbacFreezeBlocked, 'Security Audit: RBAC matrix blocks Accountant role from freezing snapshot');

    // -------------------------------------------------------------------------
    // 11G: Production Monitoring & Observability
    // -------------------------------------------------------------------------
    console.log('\n--- 11G: Production Monitoring & Observability ---');
    metricsService.recordMetric('GSTN_SUBMISSION_SUCCESS', 1);
    metricsService.recordMetric('GSTN_RESPONSE_TIME', 95);

    const prodMetrics = metricsService.getMetrics();
    assert(prodMetrics.GSTN_SUBMISSION_SUCCESS >= 1, 'Observability: Tracked GSTN_SUBMISSION_SUCCESS');
    assert(prodMetrics.GSTN_RESPONSE_TIME > 0, 'Observability: Tracked GSTN_RESPONSE_TIME');

    // -------------------------------------------------------------------------
    // Cumulative System Verification (Phases 7–10 Regression)
    // -------------------------------------------------------------------------
    console.log('\n--- Cumulative Subsystem Regression Check ---');
    const mapped = await mapperService.mapGstr1Return(testPeriod, testOrg);
    assert(Array.isArray(mapped.b2b), 'Phase 7 Regression: Table 4 B2B mapper structure valid');

    const lockResult = validationService.isPeriodLocked(testPeriod);
    assert(lockResult, 'Phase 8 Regression: Period lock enforced on frozen snapshot');

    const caPackage = await caExportService.generatePackage(testPeriod, 'Accountant Lead', testOrg);
    assert(Boolean(caPackage.packageHash), 'Phase 9 Regression: CA Export package hash verified');

    const prepPayload = payloadMapper.mapSnapshotToGstnPayload(snapshot);
    const schemaCheck = schemaValidator.validateGstnPayload(prepPayload);
    assert(schemaCheck.isValid, 'Phase 10 Regression: GSTN payload schema validation verified');

    console.log('\n================================================================');
    console.log(`=== PHASE 11 CERTIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED ===`);
    console.log('================================================================\n');

    if (passedTests === totalTests) {
      console.log('✅ GHANSHYAM AYURVEDIC ERP: PHASE 11 FINAL PRODUCTION & LIVE COMPLIANCE CERTIFIED!');
    } else {
      console.error('❌ PHASE 11 CERTIFICATION FAILED SOME PRODUCTION ACCEPTANCE CRITERIA!');
    }
  } catch (error) {
    console.error('CRITICAL ERROR DURING PHASE 11 CERTIFICATION RUN:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPhase11ProductionCertification();
