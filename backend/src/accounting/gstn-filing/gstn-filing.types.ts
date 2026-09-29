// Contract Definitions & Official GSTN Schema Payload Types

export type GstnFilingLifecycleStatus =
  | 'DRAFT'
  | 'VALIDATED'
  | 'FROZEN'
  | 'READY_TO_FILE'
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'ACCEPTED'
  | 'SUBMISSION_FAILED'
  | 'VALIDATION_FAILED'
  | 'REJECTED';

// Official GSTN GSTR-1 JSON Schema Contract
export interface GstnB2BItemDetail {
  rt: number;
  txval: number;
  iamt: number;
  camt: number;
  samt: number;
}

export interface GstnB2BItem {
  num: number;
  itm_det: GstnB2BItemDetail;
}

export interface GstnB2BInvoice {
  inum: string;
  idt: string; // DD-MM-YYYY format
  val: number;
  pos: string;
  rchg: 'Y' | 'N';
  inv_typ: 'R' | 'SEWOP' | 'SEWP';
  itms: GstnB2BItem[];
}

export interface GstnB2BSection {
  ctin: string;
  inv: GstnB2BInvoice[];
}

export interface GstnB2CLInvoice {
  inum: string;
  idt: string;
  val: number;
  itms: Array<{ num: number; itm_det: { rt: number; txval: number; iamt: number } }>;
}

export interface GstnB2CLSection {
  pos: string;
  inv: GstnB2CLInvoice[];
}

export interface GstnB2CSSection {
  sply_ty: 'INTER' | 'INTRA';
  pos: string;
  rt: number;
  txval: number;
  iamt: number;
  camt: number;
  samt: number;
}

export interface GstnHsnItem {
  hsn_sc: string;
  desc: string;
  uqc: string;
  qty: number;
  val: number;
  txval: number;
  iamt: number;
  camt: number;
  samt: number;
}

export interface GstnDocumentDetail {
  doc_num: number;
  doc_typ: string;
  from: string;
  to: string;
  totnum: number;
  cancel: number;
  net_issue: number;
}

export interface GstnGstr1Payload {
  gstin: string;
  fp: string; // e.g. "092026" for Sep 2026
  gt: number;
  cur_gt: number;
  b2b: GstnB2BSection[];
  b2cl: GstnB2CLSection[];
  b2cs: GstnB2CSSection[];
  exp: any[];
  cdnr: any[];
  hsn: {
    hsn_b2b: GstnHsnItem[];
    hsn_b2c: GstnHsnItem[];
  };
  doc_issue: {
    doc_det: GstnDocumentDetail[];
  };
}

export interface GspSubmissionResponse {
  success: boolean;
  referenceId: string;
  status: 'SUBMITTED' | 'PROCESSING' | 'SUBMISSION_FAILED';
  errorCode?: string;
  errorMessage?: string;
  submittedAt: string;
}

export interface GspStatusResponse {
  referenceId: string;
  status: 'PROCESSING' | 'ACCEPTED' | 'REJECTED';
  arn?: string;
  errorCode?: string;
  errorMessage?: string;
  completedAt?: string;
}
