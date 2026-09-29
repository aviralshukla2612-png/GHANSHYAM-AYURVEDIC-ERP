export type CaReviewStatus = 'NOT_SENT' | 'SENT' | 'UNDER_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED';

export interface CaExportPreview {
  period: string;
  snapshotId?: string;
  snapshotStatus: 'FROZEN' | 'DRAFT' | 'NOT_FROZEN';
  auditStatus: 'PASSED' | 'FAILED' | 'WARNINGS';
  reconciliationStatus: 'RECONCILED' | 'UNEXPLAINED_VARIANCES';
  criticalExceptions: number;
  sourceDataHash?: string;
  payloadHash?: string;
  isReadyForExport: boolean;
  warningMessage?: string;
}

export interface CaExportPackageResponse {
  id: string;
  organizationId: string;
  period: string;
  snapshotId: string;
  status: string;
  fileCount: number;
  packageHash: string;
  readmeContent: string;
  generatedBy: string;
  generatedAt: string;
  reviewStatus: CaReviewStatus;
  downloadUrl: string;
  files: Array<{ name: string; type: string; description: string }>;
}

export interface CaReviewRecord {
  id: string;
  organizationId: string;
  exportPackageId: string;
  status: CaReviewStatus;
  reviewedBy?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}
