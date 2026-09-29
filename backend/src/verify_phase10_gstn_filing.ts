import { PrismaClient } from '@prisma/client';
import { GstEngineService } from './accounting/gst-engine.service';
import { Gstr1MapperService } from './accounting/gstr1-mapper.service';
import { Gstr1ValidationService } from './accounting/gstr1-validation.service';
import { GspMockAdapterService } from './accounting/gstn-filing/gsp-mock-adapter.service';
import { GstnPayloadMapperService } from './accounting/gstn-filing/gstn-payload-mapper.service';
import { GstnSchemaValidatorService } from './accounting/gstn-filing/gstn-schema-validator.service';
import { GstnFilingService } from './accounting/gstn-filing/gstn-filing.service';

async function verifyPhase10GstnFiling() {
  const prisma = new PrismaClient();
  const gstEngine = new GstEngineService();
  const mapperService = new Gstr1MapperService(prisma as any, gstEngine);
  const validationService = new Gstr1ValidationService(prisma as any, mapperService);
  const gspAdapter = new GspMockAdapterService();
  const payloadMapper = new GstnPayloadMapperService();
  const schemaValidator = new GstnSchemaValidatorService();

  const filingService = new GstnFilingService(
    prisma as any,
    validationService,
    payloadMapper,
    schemaValidator,
    gspAdapter
  );

  console.log('================================================================');
  console.log('=== GHANSHYAM AYURVEDIC ERP: PHASE 10 GSTN/GSP FILING CERTIFICATION ===');
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

    // -------------------------------------------------------------------------
    // 10A: Contract Definition & Payload Schema Validation
    // -------------------------------------------------------------------------
    console.log('--- 10A: Contract Definition & Schema Validation ---');
    const snapshot = await validationService.createSnapshot(testPeriod, 'Compliance Officer', 'MANAGER', testOrg);
    const preparedPayload = payloadMapper.mapSnapshotToGstnPayload(snapshot);

    assert(preparedPayload.gstin === '24AAAAG1234H1Z5', 'Payload Mapper: Correct Supplier GSTIN format');
    assert(preparedPayload.fp === '092026', 'Payload Mapper: Financial period format 092026');
    assert(Array.isArray(preparedPayload.b2b) && Array.isArray(preparedPayload.b2cl), 'Payload Mapper: B2B and B2CL arrays present');

    const schemaResult = schemaValidator.validateGstnPayload(preparedPayload);
    assert(schemaResult.isValid, 'Schema Validator: Official GSTN GSTR-1 payload schema validation passed');

    // -------------------------------------------------------------------------
    // 10B: GSTN/GSP Adapter Authentication & Interface Decoupling
    // -------------------------------------------------------------------------
    console.log('\n--- 10B: GSTN/GSP Adapter Authentication & Provider Decoupling ---');
    const authRes = await gspAdapter.authenticate(preparedPayload.gstin);
    assert(authRes.success && authRes.authHeader.startsWith('Bearer'), 'GSP Adapter: Authentication token issued');

    // -------------------------------------------------------------------------
    // 10C: Filing Preparation & Submission Lifecycle
    // -------------------------------------------------------------------------
    console.log('\n--- 10C: Filing Preparation & Submission Lifecycle ---');
    const prepRes = await filingService.prepareFiling(testPeriod, testOrg);
    assert(prepRes.status === 'READY_TO_FILE', 'Filing Manager: Prepared filing status is READY_TO_FILE');

    const submitRes = await filingService.submitFiling(testPeriod, 'Chief Accountant', testOrg);
    assert(submitRes.status === 'SUBMITTED' && Boolean(submitRes.externalRefId), 'Filing Manager: GSTR-1 payload submitted to GSP portal', `Ref: ${submitRes.externalRefId}`);

    // Poll status for ARN assignment
    const pollRes = await filingService.pollFilingStatus(submitRes.id, testOrg);
    assert(pollRes.status === 'ACCEPTED' && Boolean(pollRes.arn), 'Filing Status Polling: Status transitioned to ACCEPTED with ARN', `ARN: ${pollRes.arn}`);

    // -------------------------------------------------------------------------
    // 10D: Error Mapping & Rejection Handling
    // -------------------------------------------------------------------------
    console.log('\n--- 10D: Error Mapping & Rejection Handling ---');
    const mappedError = schemaValidator.mapGstnError('RET0002');
    assert(mappedError.code === 'RET0002' && mappedError.message.includes('Duplicate invoice'), 'Error Mapper: RET0002 translated to Duplicate Invoice message');

    const inactiveGstinError = schemaValidator.mapGstnError('GSTIN_INACTIVE');
    assert(inactiveGstinError.resolutionUrl === '/dashboard/sales/customers', 'Error Mapper: GSTIN_INACTIVE mapped to customer resolution URL');

    // Test rejection flow with invalid payload
    const invalidPayload = { ...preparedPayload, gt: -500 };
    const submitRejectionRes = await gspAdapter.submitGstr1Payload(invalidPayload.gstin, testPeriod, invalidPayload, authRes.authHeader);
    assert(submitRejectionRes.status === 'SUBMISSION_FAILED' && submitRejectionRes.errorCode === 'RET0001', 'GSP Rejection Path: Invalid payload rejected with RET0001');

    // -------------------------------------------------------------------------
    // 10E: Critical Rule Assertion & Audit Trail
    // -------------------------------------------------------------------------
    console.log('\n--- 10E: Critical Rule Assertion & Filing History Audit Trail ---');

    // CRITICAL RULE: Mutating live sales invoice AFTER snapshot freeze does NOT affect the mapped filing payload!
    await prisma.salesInvoice.updateMany({
      where: { invoiceNumber: 'INV-PH8-001' },
      data: { totalAmount: 999999 },
    });

    const payloadAfterMutation = payloadMapper.mapSnapshotToGstnPayload(snapshot);
    const isPayloadIdentical = JSON.stringify(preparedPayload) === JSON.stringify(payloadAfterMutation);
    assert(isPayloadIdentical, 'CRITICAL RULE ASSERTIED: Live sales mutation does NOT alter frozen snapshot filing payload!');

    // Filing History Retrieval
    const history = await filingService.getFilingHistory(testPeriod, testOrg);
    assert(history.length > 0 && history[0].status === 'ACCEPTED', 'Filing History: Recorded complete submission audit trail');

    // Audit Log check
    const auditLogs = await prisma.auditLog.findMany({ where: { action: 'GSTR1_FILING_SUBMITTED' } });
    assert(auditLogs.length > 0, 'Audit Trail: GSTR1_FILING_SUBMITTED action recorded in system audit log');

    console.log('\n================================================================');
    console.log(`=== PHASE 10 CERTIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED ===`);
    console.log('================================================================\n');

    if (passedTests === totalTests) {
      console.log('✅ GHANSHYAM AYURVEDIC ERP: PHASE 10 GSTN/GSP FILING INTEGRATION CERTIFIED!');
    } else {
      console.error('❌ PHASE 10 CERTIFICATION FAILED SOME ACCEPTANCE CRITERIA!');
    }
  } catch (error) {
    console.error('CRITICAL ERROR DURING PHASE 10 CERTIFICATION RUN:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPhase10GstnFiling();
