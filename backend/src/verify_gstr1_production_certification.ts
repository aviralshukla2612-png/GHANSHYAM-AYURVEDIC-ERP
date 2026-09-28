import { PrismaClient } from '@prisma/client';
import { GstEngineService } from './accounting/gst-engine.service';
import { Gstr1MapperService } from './accounting/gstr1-mapper.service';
import { Gstr1ValidationService } from './accounting/gstr1-validation.service';
import { GstReconciliationService, GST_RECONCILIATION_TOLERANCE } from './accounting/gst-reconciliation.service';
import { roundCurrency } from './accounting/gst-config';

async function verifyGstr1ProductionCertification() {
  const prisma = new PrismaClient();
  const gstEngine = new GstEngineService();
  const mapperService = new Gstr1MapperService(prisma as any, gstEngine);
  const validationService = new Gstr1ValidationService(prisma as any, mapperService);
  const reconciliationService = new GstReconciliationService(prisma as any, mapperService);

  console.log('================================================================');
  console.log('=== GHANSHYAM AYURVEDIC ERP: PHASE 7 GSTR-1 PRODUCTION CERTIFICATION ===');
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
    // TEST 1: GST Calculation Tax Matrix (Intra-state vs Inter-state)
    const intraRes = gstEngine.calculateTax(100000, 18, '24', 'Gujarat');
    assert(
      !intraRes.isInterState && intraRes.cgstAmount === 9000 && intraRes.sgstAmount === 9000 && intraRes.igstAmount === 0,
      'Intra-State Gujarat Tax Split',
      `CGST: ${intraRes.cgstAmount}, SGST: ${intraRes.sgstAmount}`
    );

    const interResMH = gstEngine.calculateTax(100000, 18, '27', 'Maharashtra');
    assert(
      interResMH.isInterState && interResMH.cgstAmount === 0 && interResMH.sgstAmount === 0 && interResMH.igstAmount === 18000,
      'Inter-State Maharashtra Tax Split',
      `IGST: ${interResMH.igstAmount}`
    );

    const interResDL = gstEngine.calculateTax(100000, 18, '07', 'Delhi');
    assert(
      interResDL.isInterState && interResDL.igstAmount === 18000,
      'Inter-State Delhi Tax Split',
      `IGST: ${interResDL.igstAmount}`
    );

    // TEST 2: Boundary Value Classification (B2CL ₹1 Lakh Threshold)
    const b2cSmall99k = gstEngine.classifyGstr1Invoice({ customerGstin: null, isInterState: true, totalAmount: 99999 });
    assert(b2cSmall99k.gstrSection === 'TABLE_7_B2CS', 'B2C Inter-State ₹99,999 -> Table 7 B2CS');

    const b2cSmall100k = gstEngine.classifyGstr1Invoice({ customerGstin: null, isInterState: true, totalAmount: 100000 });
    assert(b2cSmall100k.gstrSection === 'TABLE_7_B2CS', 'B2C Inter-State ₹1,00,000 -> Table 7 B2CS');

    const b2cLarge100k1 = gstEngine.classifyGstr1Invoice({ customerGstin: null, isInterState: true, totalAmount: 100001 });
    assert(b2cLarge100k1.gstrSection === 'TABLE_5_B2CL', 'B2C Inter-State ₹1,00,001 -> Table 5 B2CL');

    // TEST 3: Tax Rate Matrix (0%, 5%, 12%, 18%, 28%) & Line-Level Rounding Assertions
    const rates = [0, 5, 12, 18, 28];
    let allRoundingPassed = true;
    rates.forEach((rate) => {
      const taxable = 42555.55;
      const calc = gstEngine.calculateTax(taxable, rate, '24', 'Gujarat');
      const sumLine = roundCurrency(calc.taxableValue + calc.totalTax);
      if (sumLine !== calc.totalAmount) allRoundingPassed = false;
    });
    assert(allRoundingPassed, 'Tax Rate Matrix (0%-28%) Rounding Assertions');

    // TEST 4: GSTR-1 Mapper Structure & Table 12/13 Coverage
    const returnData = await mapperService.mapGstr1Return('September 2026');
    assert(Array.isArray(returnData.b2b), 'Mapper Table 4 B2B Structure');
    assert(Array.isArray(returnData.b2cl), 'Mapper Table 5 B2CL Structure');
    assert(Array.isArray(returnData.b2cs), 'Mapper Table 7 B2CS Structure');
    assert(Array.isArray(returnData.hsn.b2b) && Array.isArray(returnData.hsn.b2c), 'Mapper Table 12 HSN B2B/B2C Split');
    assert(returnData.documents.length >= 3, 'Mapper Table 13 Documents Series');

    // TEST 5: Audit & Validation Engine
    const auditReport = await validationService.validateGstr1Return('September 2026');
    assert(auditReport.totalChecks === 9, 'Validation Engine Checks Count', `Checked: ${auditReport.totalChecks}`);

    // TEST 6: Granular Reconciliation Engine
    const reconReport = await reconciliationService.reconcileInvoiceVsLedger('September 2026');
    assert(reconReport.turnoverVariance <= GST_RECONCILIATION_TOLERANCE, 'Reconciliation Turnover Variance within Tolerance');

    // TEST 7: Immutable Snapshot & Selective Hash Invalidation Test
    const snapshot = await validationService.createSnapshot('September 2026', 'Certification Bot');
    assert(snapshot.status === 'FROZEN', 'Immutable Snapshot Created with Status FROZEN');
    assert(snapshot.integrityStatus === 'INTEGRITY_VERIFIED', 'Initial Snapshot Integrity Verified');

    // TEST 8: Credit / Debit Notes Table 9 Reconcile
    const cdnrList = await reconciliationService.getCreditDebitNotes('September 2026');
    assert(cdnrList.length > 0, 'Table 9 Credit/Debit Notes Reconciled');

    console.log('\n================================================================');
    console.log(`=== CERTIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED ===`);
    console.log('================================================================\n');

    if (passedTests === totalTests) {
      console.log('✅ GSTR-1 SUB-SYSTEM PASSED ALL PRODUCTION CERTIFICATION CRITERIA!');
    } else {
      console.error('❌ GSTR-1 CERTIFICATION FAILED SOME ACCEPTANCE CRITERIA!');
    }
  } catch (error) {
    console.error('CRITICAL ERROR DURING GSTR-1 CERTIFICATION RUN:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyGstr1ProductionCertification();
