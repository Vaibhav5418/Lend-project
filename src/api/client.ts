const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'lendflow_token';

/** Ping backend health to keep Render (and similar) from cold-starting. No auth. */
export async function pingHealth(): Promise<void> {
  try {
    await fetch(`${API_BASE}/health`, { method: 'GET' });
  } catch {
    // Ignore; keep-alive is best-effort
  }
}

export type InquiryDocument = {
  _id: string;
  inquiryId: string;
  fileName: string;
  mimeType?: string;
  cloudinaryUrl: string;
  publicId: string;
  resourceType?: string;
  summary: string;
  uploadedAt: string;
};

function getAuthHeaders(): Record<string, string> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isForm = options?.body instanceof FormData;
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(isForm ? (options?.headers as Record<string, string> ?? {}) : { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string>) }),
  };
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getInquiries: () => request<import('../types').Inquiry[]>('/inquiries'),
  getInquiry: (id: string) => request<import('../types').Inquiry>(`/inquiries/${id}`),
  createInquiry: (body: Omit<import('../types').Inquiry, 'id'>) =>
    request<import('../types').Inquiry>('/inquiries', { method: 'POST', body: JSON.stringify(body) }),
  updateInquiry: (id: string, body: Partial<import('../types').Inquiry>) =>
    request<import('../types').Inquiry>(`/inquiries/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteInquiry: (id: string) => request<void>(`/inquiries/${id}`, { method: 'DELETE' }),
  /** PATCH /api/inquiries/:id/stage – validates stage against inquiry type, updates stage & lastActivityAt, appends to activityLogs */
  updateInquiryStage: (id: string, stage: string) =>
    request<import('../types').Inquiry>(`/inquiries/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
  getStaff: () => request<string[]>('/staff'),
  getAgents: () =>
    request<{ id: string; name: string; totalInquiries: number; conversions: number }[]>('/agents'),

  getInquiryDocuments: (inquiryId: string) =>
    request<InquiryDocument[]>(`/inquiries/${inquiryId}/documents`),
  uploadInquiryDocument: (inquiryId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<InquiryDocument>(`/inquiries/${inquiryId}/documents`, {
      method: 'POST',
      body: form,
    });
  },
  deleteInquiryDocument: (inquiryId: string, docId: string) =>
    request<void>(`/inquiries/${inquiryId}/documents/${docId}`, { method: 'DELETE' }),
  /** Fetch document for inline view (with auth). Returns blob so it can be shown in iframe via object URL. */
  getDocumentViewBlob: (inquiryId: string, docId: string): Promise<Blob> => {
    return fetch(`${API_BASE}/inquiries/${inquiryId}/documents/${docId}/view`, {
      headers: getAuthHeaders(),
    }).then((res) => {
      if (!res.ok) throw new Error(res.status === 401 ? 'Authentication required' : 'Failed to load document');
      return res.blob();
    });
  },
  regenerateDocumentSummary: (inquiryId: string, docId: string) =>
    request<InquiryDocument>(`/inquiries/${inquiryId}/documents/${docId}/summary`, {
      method: 'POST',
    }),
  /** Generate one combined AI report and profile score from all documents. */
  getCombinedReport: (inquiryId: string) =>
    request<{ markdown: string; profileScore?: number; profileScoreRating?: string }>(
      `/inquiries/${inquiryId}/documents/combined-report`,
      { method: 'POST' }
    ),
};
