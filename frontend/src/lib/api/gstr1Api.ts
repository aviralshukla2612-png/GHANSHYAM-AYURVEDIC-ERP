import { apiClient } from './apiClient';

export interface Gstr1ApiParams {
  period?: string;
}

export async function fetchGstr1Return(period: string = 'September 2026') {
  return apiClient.get(`/api/accounting/gstr1?period=${encodeURIComponent(period)}`);
}

export async function runGstr1Audit(period: string = 'September 2026') {
  return apiClient.post('/api/accounting/gst/validate', { period });
}

export async function createGstr1Snapshot(period: string = 'September 2026', userId: string = 'Head Accountant') {
  return apiClient.post('/api/accounting/gstr1/snapshot', { period, userId });
}

export async function fetchGstr1Snapshots(period: string = 'September 2026') {
  return apiClient.get(`/api/accounting/gstr1/snapshots?period=${encodeURIComponent(period)}`);
}

export async function fetchGstExceptions(period: string = 'September 2026') {
  return apiClient.get(`/api/accounting/gstr1/exceptions?period=${encodeURIComponent(period)}`);
}

export async function resolveGstException(id: string, notes?: string) {
  return apiClient.post(`/api/accounting/gstr1/exceptions/${id}/resolve`, { notes });
}

export async function fetchCaExportPreview(period: string = 'September 2026') {
  return apiClient.get(`/api/accounting/ca-export/preview?period=${encodeURIComponent(period)}`);
}

export async function generateCaExportPackage(period: string = 'September 2026') {
  return apiClient.post('/api/accounting/ca-export/generate', { period });
}

export async function downloadCaExportFile(packageId: string, fileName: string = '01_GSTR1_Summary.xlsx') {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ghanshyam_token') : '';
  const url = `/api/accounting/ca-export/${packageId}/download?file=${encodeURIComponent(fileName)}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download export file');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export async function createCaReview(exportPackageId: string, status: string = 'SENT', comments?: string) {
  return apiClient.post('/api/accounting/ca-review', { exportPackageId, status, comments });
}

export async function updateCaReviewStatus(id: string, status: string, comments?: string) {
  return apiClient.patch(`/api/accounting/ca-review/${id}`, { status, comments });
}

export async function prepareGstnFiling(period: string = 'September 2026') {
  return apiClient.get(`/api/accounting/gstn-filing/prepare?period=${encodeURIComponent(period)}`);
}

export async function submitGstnFiling(period: string = 'September 2026') {
  return apiClient.post('/api/accounting/gstn-filing/submit', { period });
}

export async function pollGstnFilingStatus(id: string) {
  return apiClient.post(`/api/accounting/gstn-filing/${id}/poll`, {});
}

export async function fetchGstnFilingHistory(period: string = 'September 2026') {
  return apiClient.get(`/api/accounting/gstn-filing/history?period=${encodeURIComponent(period)}`);
}

export async function lockGstr1Period(period: string = 'September 2026') {
  return apiClient.post('/api/accounting/gstr1/lock', { period });
}

export async function unfreezeGstr1Period(period: string = 'September 2026') {
  return apiClient.post('/api/accounting/gstr1/unfreeze', { period });
}

export async function fetchGstr1Metrics() {
  return apiClient.get('/api/accounting/gstr1/metrics');
}
