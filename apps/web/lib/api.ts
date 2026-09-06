const API_BASE = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || '/api')
  : (process.env.INTERNAL_API_URL || 'http://127.0.0.1:8000/api');

class ApiClient {
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  private getHeaders(contentType = 'application/json') {
    const headers: Record<string, string> = {};
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      ...this.getHeaders(options.body instanceof FormData ? '' : 'application/json'),
      ...options.headers,
    };

    if (options.body instanceof FormData) {
      delete (headers as any)['Content-Type'];
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errData.detail || errData.error?.message || 'API request failed');
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.access_token && typeof window !== 'undefined') {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  }

  // Dashboard
  async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  // Documents
  async listDocuments(status?: string) {
    return this.request<any[]>(`/documents${status ? `?status=${status}` : ''}`);
  }

  async getDocument(id: string) {
    return this.request<any>(`/documents/${id}`);
  }

  async uploadDocument(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<any>('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async reprocessDocument(id: string) {
    return this.request<any>(`/documents/${id}/process`, {
      method: 'POST',
    });
  }

  // Records
  async listRecords(params: Record<string, string> = {}) {
    const searchParams = new URLSearchParams(params).toString();
    return this.request<any[]>(`/records${searchParams ? `?${searchParams}` : ''}`);
  }

  async getRecord(id: string) {
    return this.request<any>(`/records/${id}`);
  }

  async validateRecord(id: string) {
    return this.request<any>(`/records/${id}/validate`, {
      method: 'POST',
    });
  }

  // Parcels
  async getParcelsGeoJSON() {
    return this.request<any>('/parcels/geojson');
  }

  async listParcels() {
    return this.request<any[]>('/parcels');
  }

  // Verification
  async listVerificationTasks(status?: string) {
    return this.request<any[]>(`/verification/tasks${status ? `?status=${status}` : ''}`);
  }

  async approveRecord(id: string, notes?: string) {
    return this.request<any>(`/verification/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async rejectRecord(id: string, reason: string, notes?: string) {
    return this.request<any>(`/verification/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
    });
  }

  async editField(id: string, fieldName: string, newValue: any, reason: string) {
    return this.request<any>(`/verification/${id}/edit-field`, {
      method: 'POST',
      body: JSON.stringify({ field_name: fieldName, new_value: newValue, reason }),
    });
  }

  // Anomalies
  async listAnomalies(severity?: string) {
    return this.request<any[]>(`/anomalies${severity ? `?severity=${severity}` : ''}`);
  }

  async resolveAnomaly(id: string) {
    return this.request<any>(`/anomalies/${id}/resolve`, {
      method: 'POST',
    });
  }

  // Search
  async search(query: string) {
    return this.request<any[]>(`/search?q=${encodeURIComponent(query)}`);
  }

  // Assistant
  async chatAssistant(query: string, recordId?: string) {
    return this.request<any>('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ query, record_id: recordId }),
    });
  }

  // Audit Logs
  async listAuditLogs(recordId?: string) {
    return this.request<any[]>(`/audit-logs${recordId ? `?record_id=${recordId}` : ''}`);
  }

  // Machine Learning
  async getMLMetrics() {
    return this.request<any>('/ml/metrics');
  }

  async predictMLFraud(features: Record<string, any>) {
    return this.request<any>('/ml/predict', {
      method: 'POST',
      body: JSON.stringify(features),
    });
  }

  async retrainMLModel() {
    return this.request<any>('/ml/retrain', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();

