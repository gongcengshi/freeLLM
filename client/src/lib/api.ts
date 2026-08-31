const API_BASE = '/api';

export interface Provider {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  authType: string;
  models: string[];
  rateLimits: {
    rpm: number;
    rpd: number;
    tpm: number;
    tpd: number;
  };
  features: {
    streaming: boolean;
    tools: boolean;
    vision: boolean;
    reasoning: boolean;
  };
  enabled: boolean;
}

export interface ApiKey {
  id: string;
  providerId: string;
  name: string;
  key: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  lastCheckedAt?: string;
  cooldownUntil?: string;
  usage: Record<string, number>;
}

export interface RequestLog {
  id: string;
  timestamp: string;
  model: string;
  providerId: string;
  apiKeyId: string;
  status: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  error?: string;
}

export interface LogStats {
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  totalTokens: number;
  avgLatencyMs: number;
  byProvider: Record<string, { requests: number; tokens: number }>;
}

export interface ModelScore {
  modelId: string;
  providerId: string;
  health: number;
  speed: number;
  quality: number;
  availability: number;
  reliability: number;
  totalScore: number;
  lastChecked: string;
  lastUsed?: string;
  errorCount: number;
  successCount: number;
}

export interface HealthCheckResult {
  providerId: string;
  status: string;
  latencyMs?: number;
  error?: string;
  checkedAt: string;
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  providers: {
    list: () => fetchApi<Provider[]>('/admin/providers'),
    get: (id: string) => fetchApi<Provider>(`/admin/providers/${id}`),
    create: (provider: Provider) => fetchApi<Provider>('/admin/providers', {
      method: 'POST',
      body: JSON.stringify(provider),
    }),
    update: (id: string, updates: Partial<Provider>) => fetchApi<Provider>(`/admin/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
    delete: (id: string) => fetchApi<void>(`/admin/providers/${id}`, {
      method: 'DELETE',
    }),
  },
  apiKeys: {
    list: () => fetchApi<ApiKey[]>('/admin/api-keys'),
    get: (id: string) => fetchApi<ApiKey>(`/admin/api-keys/${id}`),
    create: (data: { providerId: string; name: string; key: string }) => fetchApi<ApiKey>('/admin/api-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, updates: Partial<ApiKey>) => fetchApi<void>(`/admin/api-keys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
    delete: (id: string) => fetchApi<void>(`/admin/api-keys/${id}`, {
      method: 'DELETE',
    }),
  },
  logs: {
    list: (params?: { limit?: number; offset?: number; providerId?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      if (params?.providerId) searchParams.set('providerId', params.providerId);
      return fetchApi<RequestLog[]>(`/admin/logs?${searchParams.toString()}`);
    },
    stats: (params?: { providerId?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.providerId) searchParams.set('providerId', params.providerId);
      return fetchApi<LogStats>(`/admin/logs/stats?${searchParams.toString()}`);
    },
  },
  scores: {
    list: (providerId?: string) => {
      const searchParams = new URLSearchParams();
      if (providerId) searchParams.set('providerId', providerId);
      return fetchApi<ModelScore[]>(`/admin/scores?${searchParams.toString()}`);
    },
  },
  health: {
    check: () => fetchApi<HealthCheckResult[]>('/admin/health'),
    checkProvider: (providerId: string) => fetchApi<HealthCheckResult>(`/admin/health/${providerId}`),
  },
};
