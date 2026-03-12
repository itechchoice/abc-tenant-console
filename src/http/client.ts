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

const DEFAULT_API_PREFIX = import.meta.env.VITE_API_BASE_URL || '/tenant-console-api';

function normalizeApiBasePath(servicePath: string) {
  const normalizedPrefix = DEFAULT_API_PREFIX.endsWith('/')
    ? DEFAULT_API_PREFIX.slice(0, -1)
    : DEFAULT_API_PREFIX;
  const normalizedServicePath = servicePath.startsWith('/')
    ? servicePath
    : `/${servicePath}`;

  return `${normalizedPrefix}${normalizedServicePath}`;
}

function createServiceClient(servicePath: string) {
  return axios.create({
    baseURL: normalizeApiBasePath(servicePath),
    timeout: 10000,
  });
}

<<<<<<< Updated upstream
export const authApiBaseUrl = normalizeApiBasePath('/auth-server');
export const engineApiBaseUrl = normalizeApiBasePath('/engine');
export const llmGatewayApiBaseUrl = normalizeApiBasePath('/llm-gateway');
export const mcpApiBaseUrl = normalizeApiBasePath('/mcp-gateway');

export const authApiClient = createServiceClient('/auth-server');
export const engineApiClient = createServiceClient('/engine');
export const llmGatewayApiClient = createServiceClient('/llm-gateway');
export const mcpApiClient = createServiceClient('/mcp-gateway');

export const apiClient = engineApiClient;
const clients = [authApiClient, engineApiClient, llmGatewayApiClient, mcpApiClient];

clients.forEach((client) => {
  client.interceptors.request.use(
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
=======
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      debugger
      if (authConfig.devBypassEnabled) {
        return Promise.reject(error);
>>>>>>> Stashed changes
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  client.interceptors.response.use(
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
});
