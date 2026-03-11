import axios from 'axios';
import { authConfig } from '@/config/auth';
import { useAuthStore } from '@/stores/authStore';

// ---------------------------------------------------------------------------
// Shared API response types
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string | null;
  requestId?: string | null;
}

export function unwrap<T>(res: ApiResponse<T>): T {
  if (res.code !== 0) {
    throw new Error(res.message ?? `API error (code: ${res.code})`);
  }
  return res.data;
}

// ---------------------------------------------------------------------------
// Request ID
// ---------------------------------------------------------------------------

const loginPath = new URL('login', window.location.origin + import.meta.env.BASE_URL).pathname;

export function createRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/tenant-console-api',
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const { token, userInfo } = useAuthStore.getState();
    config.headers = config.headers ?? {};

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (userInfo?.tenantId && !config.headers['X-Tenant-Id']) {
      config.headers['X-Tenant-Id'] = userInfo.tenantId;
    }
    if (!config.headers['X-Request-Id']) {
      config.headers['X-Request-Id'] = createRequestId();
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      if (authConfig.devBypassEnabled) {
        return Promise.reject(error);
      }

      useAuthStore.getState().logout();
      window.location.href = loginPath;
    }
    return Promise.reject(error);
  },
);
