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

export async function createGstr1Snapshot(period: string = 'September 2026', userId: string = 'Accountant') {
  return apiClient.post('/api/accounting/gstr1/snapshot', { period, userId });
}

export async function fetchGstr1Snapshots(period: string = 'September 2026') {
  return apiClient.get(`/api/accounting/gstr1/snapshots?period=${encodeURIComponent(period)}`);
}
