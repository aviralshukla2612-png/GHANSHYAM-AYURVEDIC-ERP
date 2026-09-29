import { GspSubmissionResponse, GspStatusResponse, GstnGstr1Payload } from './gstn-filing.types';

export interface IGspAdapter {
  authenticate(gstin: string, username?: string): Promise<{ success: boolean; authHeader: string; expiresAt: Date }>;
  submitGstr1Payload(
    gstin: string,
    period: string,
    payload: GstnGstr1Payload,
    authHeader: string
  ): Promise<GspSubmissionResponse>;
  pollFilingStatus(gstin: string, period: string, referenceId: string, authHeader: string): Promise<GspStatusResponse>;
}
