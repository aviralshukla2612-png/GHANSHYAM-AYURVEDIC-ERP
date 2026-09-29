// Strongly Typed Contracts for GSTR-1 Mapper, Validation Engine, Reconciliation, and Snapshot Integrity

export interface B2BRow {
  gstin: string;
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  placeOfSupply: string;
  isReverseCharge: boolean;
  rate: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface B2CLRow {
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  placeOfSupply: string;
  rate: number;
  taxableValue: number;
  igst: number;
}

export interface ExportRow {
  exportType: 'WITH_PAYMENT' | 'WITHOUT_PAYMENT';
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  shippingBillNo?: string;
  shippingBillDate?: string;
  portCode?: string;
  rate: number;
  taxableValue: number;
  igst: number;
}

export interface B2CSRow {
  placeOfSupply: string;
  type: string; // OE (Other than E-Commerce)
  rate: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface NilRatedRow {
  description: string;
  nilRatedAmount: number;
  exemptedAmount: number;
  nonGstAmount: number;
}

export interface CreditDebitNoteRow {
  id?: string;
  gstin?: string;
  customerName: string;
  noteType: 'CREDIT' | 'DEBIT';
  noteNumber: string;
  noteDate: string;
  originalInvoiceNumber: string;
  originalInvoiceDate: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  reason?: string;
}

export interface HsnRow {
  hsnCode: string;
  description: string;
  uqc: string;
  totalQuantity: number;
  totalValue: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface DocumentSummary {
  docType: string;
  tableSection: string;
  fromNo: string;
  toNo: string;
  totalCount: number;
  cancelledCount: number;
  netIssuedCount: number;
}

export interface Gstr1Summary {
  totalSales: number;
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  b2bCount: number;
  b2clCount: number;
  b2csCount: number;
  exportCount: number;
  cdnrCount: number;
}

export interface Gstr1ReturnData {
  period: string;
  generatedAt: string;
  b2b: B2BRow[];
  b2cl: B2CLRow[];
  exports: ExportRow[];
  b2cs: B2CSRow[];
  nilRated: NilRatedRow[];
  creditDebitNotes: CreditDebitNoteRow[];
  hsn: {
    b2b: HsnRow[];
    b2c: HsnRow[];
  };
  documents: DocumentSummary[];
  summary: Gstr1Summary;
}

export interface ValidationErrorItem {
  code: string; // e.g. ERR_GSTIN_INVALID, ERR_HSN_MISMATCH, ERR_DOC_GAP, ERR_LEDGER_MISMATCH
  severity: 'ERROR' | 'WARNING';
  entity: 'INVOICE' | 'CUSTOMER' | 'HSN' | 'DOCUMENT' | 'LEDGER';
  entityId?: string;
  entityNumber?: string;
  field?: string;
  message: string;
  resolutionUrl?: string; // Actionable deep link for accountants
}

export interface Gstr1ValidationReport {
  period: string;
  status: 'READY_FOR_EXPORT' | 'VALIDATION_FAILED' | 'WARNINGS_PRESENT';
  totalChecks: number;
  passedCount: number;
  warningCount: number;
  errorCount: number;
  errors: ValidationErrorItem[];
  checkedAt: string;
}

export interface InvoiceReconciliationItem {
  invoiceNumber: string;
  invoiceTaxable: number;
  ledgerTaxable: number;
  taxableDiff: number;
  invoiceTax: number;
  ledgerTax: number;
  taxDiff: number;
  status: 'MATCHED' | 'TAXABLE_MISMATCH' | 'TAX_MISMATCH' | 'MISSING_LEDGER';
}

export interface Gstr1ReconciliationReport {
  period: string;
  status: 'RECONCILED' | 'UNEXPLAINED_VARIANCES';
  totalInvoiceTurnover: number;
  gstr1ReportedTurnover: number;
  turnoverVariance: number;
  totalInvoiceTax: number;
  gstr1ReportedTax: number;
  taxVariance: number;
  invoiceReconciliations: InvoiceReconciliationItem[];
  unexplainedNotes: string[];
}

export interface Gstr1Snapshot {
  id: string;
  period: string;
  status: 'DRAFT' | 'FROZEN' | 'INVALIDATED';
  generatedAt: string;
  frozenAt?: string;
  generatedBy: string;
  sourceDataHash: string; // Hash of source sales invoices
  payloadHash: string;    // Hash of mapped GSTR-1 payload
  sourceInvoiceCount: number;
  returnData: Gstr1ReturnData;
  validationReport: Gstr1ValidationReport;
  reconciliationReport: Gstr1ReconciliationReport;
  integrityStatus: 'INTEGRITY_VERIFIED' | 'SNAPSHOT_INVALIDATED';
  modifiedInvoices?: string[];
}

export interface GstExceptionItem {
  id: string;
  code: string; // e.g. ERR_GSTIN_MISMATCH, ERR_HSN_MISSING, ERR_GST_LEDGER_MISMATCH, ERR_PERIOD_LOCKED_ATTEMPT
  severity: 'CRITICAL' | 'WARNING';
  status: 'UNRESOLVED' | 'INVESTIGATING' | 'RESOLVED';
  entityNumber: string;
  message: string;
  resolutionUrl: string;
  detectedAt: string;
}

export interface GstExceptionSummary {
  criticalCount: number;
  warningCount: number;
  resolvedCount: number;
  totalCount: number;
  exceptions: GstExceptionItem[];
}

export interface Gstr1Metrics {
  GSTR1_GENERATION_TIME: number;
  GSTR1_AUDIT_TIME: number;
  GSTR1_RECONCILIATION_TIME: number;
  GSTR1_SNAPSHOT_COUNT: number;
  GSTR1_VALIDATION_FAILURES: number;
  GSTR1_EXPORT_FAILURES: number;
  GSTN_SUBMISSION_SUCCESS: number;
  GSTN_SUBMISSION_FAILURE: number;
  GSTN_REJECTION_COUNT: number;
  GSTN_POLLING_FAILURE: number;
  GSTN_RESPONSE_TIME: number;
}


