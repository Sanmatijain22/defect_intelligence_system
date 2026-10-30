import {
  DashboardStats,
  InspectionSummary,
  InspectionDetail,
  AppSettings,
  DemoSample
} from '../types';

/**
 * Configure API and Backend base URLs.
 * 
 * Supports:
 * - VITE_API_URL set to root server domain: 'https://defect-intelligence-system.onrender.com'
 * - VITE_API_URL set with /api: 'https://defect-intelligence-system.onrender.com/api'
 * - VITE_API_URL with trailing slash: 'https://defect-intelligence-system.onrender.com/'
 * - In production mode: defaults directly to Render cloud URL if unset
 * - In development mode: falls back to '' to use Vite dev proxy
 */
const envApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

const rawBase = envApiUrl || (import.meta.env.PROD ? 'https://defect-intelligence-system.onrender.com' : '');

// Strip trailing slashes
const cleanBase = rawBase.replace(/\/+$/, '');

// BACKEND_ROOT is the host server URL without '/api' (used for /uploads and /samples static assets)
export const BACKEND_ROOT = cleanBase.endsWith('/api')
  ? cleanBase.slice(0, -4)
  : cleanBase;

// API_BASE is the root for all REST endpoints (always includes /api)
export const API_BASE = BACKEND_ROOT ? `${BACKEND_ROOT}/api` : '/api';

/**
 * Resolves static media paths (e.g. /uploads/... or /samples/...) against the backend domain.
 */
export function resolveAssetUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return BACKEND_ROOT ? `${BACKEND_ROOT}${cleanPath}` : cleanPath;
}

async function handleResponse<T>(res: Response, defaultMessage: string): Promise<T> {
  if (!res.ok) {
    let detail = '';
    try {
      const errJson = await res.json();
      detail = errJson?.detail || '';
    } catch {
      try {
        detail = await res.text();
      } catch {
        // no body
      }
    }
    const message = detail
      ? `${defaultMessage}: ${detail}`
      : `${defaultMessage} (HTTP ${res.status} ${res.statusText})`;
    throw new Error(message);
  }
  return res.json();
}

function handleFetchError(err: any, endpointDescription: string): never {
  if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
    throw new Error(
      `Unable to connect to ${endpointDescription}. The backend server may be spinning up (Render cold-start takes ~30-50s) or unavailable. Please retry shortly.`
    );
  }
  throw err;
}

export async function getHealth(): Promise<{ status: string; service: string }> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await handleResponse(res, 'Backend health check failed');
  } catch (err) {
    return handleFetchError(err, 'backend health check');
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    return await handleResponse(res, 'Failed to fetch dashboard statistics');
  } catch (err) {
    return handleFetchError(err, 'dashboard statistics');
  }
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

  const queryString = query.toString() ? `?${query.toString()}` : '';

  try {
    const res = await fetch(`${API_BASE}/inspections${queryString}`);
    return await handleResponse(res, 'Failed to fetch inspections');
  } catch (err) {
    return handleFetchError(err, 'inspection history');
  }
}

export async function getInspectionDetail(id: string): Promise<InspectionDetail> {
  try {
    const res = await fetch(`${API_BASE}/inspections/${id}`);
    return await handleResponse(res, `Failed to fetch inspection details for ${id}`);
  } catch (err) {
    return handleFetchError(err, `inspection details [${id}]`);
  }
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

  try {
    const res = await fetch(`${API_BASE}/inspect`, {
      method: 'POST',
      body: formData,
    });
    return await handleResponse(res, 'Inspection pipeline failed');
  } catch (err) {
    return handleFetchError(err, 'inspection pipeline');
  }
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    return await handleResponse(res, 'Failed to fetch settings');
  } catch (err) {
    return handleFetchError(err, 'system settings');
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return await handleResponse(res, 'Failed to update settings');
  } catch (err) {
    return handleFetchError(err, 'settings update');
  }
}

export async function getSamples(): Promise<DemoSample[]> {
  try {
    const res = await fetch(`${API_BASE}/samples`);
    return await handleResponse(res, 'Failed to fetch demo samples');
  } catch (err) {
    return handleFetchError(err, 'demo samples');
  }
}

export function getReportDownloadUrl(inspectionId: string): string {
  return `${API_BASE}/inspections/${inspectionId}/report`;
}

export function getExportUrl(inspectionId: string, format: 'json' | 'csv'): string {
  return `${API_BASE}/inspections/${inspectionId}/export?format=${format}`;
}
