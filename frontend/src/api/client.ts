import {
  DashboardStats,
  InspectionSummary,
  InspectionDetail,
  AppSettings,
  DemoSample
} from '../types';

const API_BASE = ''; // Proxied through Vite to backend

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/api/dashboard/stats`);
  if (!res.ok) throw new Error('Failed to fetch dashboard statistics');
  return res.json();
}

export async function getInspections(params?: {
  component_name?: string;
  result?: string;
  search?: string;
  limit?: number;
}): Promise<InspectionSummary[]> {
  const query = new URLSearchParams();
  if (params?.component_name) query.append('component_name', params.component_name);
  if (params?.result) query.append('result', params.result);
  if (params?.search) query.append('search', params.search);
  if (params?.limit) query.append('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/api/inspections?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch inspections');
  return res.json();
}

export async function getInspectionDetail(id: string): Promise<InspectionDetail> {
  const res = await fetch(`${API_BASE}/api/inspections/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch inspection ${id}`);
  return res.json();
}

export async function runInspection(
  refFile: File | Blob,
  inspFile: File | Blob,
  componentName: string
): Promise<InspectionDetail> {
  const formData = new FormData();
  formData.append('reference_image', refFile, 'reference.png');
  formData.append('inspection_image', inspFile, 'inspection.png');
  formData.append('component_name', componentName);

  const res = await fetch(`${API_BASE}/api/inspect`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Inspection failed' }));
    throw new Error(err.detail || 'Inspection failed');
  }

  return res.json();
}

export async function getSettings(): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/api/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export async function getSamples(): Promise<DemoSample[]> {
  const res = await fetch(`${API_BASE}/api/samples`);
  if (!res.ok) throw new Error('Failed to fetch demo samples');
  return res.json();
}

export function getReportDownloadUrl(inspectionId: string): string {
  return `${API_BASE}/api/inspections/${inspectionId}/report`;
}

export function getExportUrl(inspectionId: string, format: 'json' | 'csv'): string {
  return `${API_BASE}/api/inspections/${inspectionId}/export?format=${format}`;
}

