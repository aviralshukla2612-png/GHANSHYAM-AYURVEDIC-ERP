// Strongly Typed Contracts for GSTR-1 Return Mapping, Validation, and Snapshots

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
  code: string; // e.g. ERR_GSTIN_INVALID, ERR_HSN_MISMATCH, ERR_DOC_GAP
  severity: 'ERROR' | 'WARNING';
  entity: 'INVOICE' | 'CUSTOMER' | 'HSN' | 'DOCUMENT';
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

export interface Gstr1Snapshot {
  id: string;
  period: string;
  status: 'GENERATED' | 'FILED' | 'SUPERSEDE';
  generatedAt: string;
  generatedBy: string;
  dataHash: string; // Hash to check if source sales data changed post snapshot
  sourceInvoiceCount: number;
  returnData: Gstr1ReturnData;
  validationReport: Gstr1ValidationReport;
  isStale?: boolean; // True if invoices edited post snapshot creation
}
