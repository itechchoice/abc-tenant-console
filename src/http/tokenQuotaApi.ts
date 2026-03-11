import { apiClient, type ApiResponse, unwrap } from './client';
import type {
  Quota,
  CreateQuotaPayload,
  RateLimitRule,
  CreateRateLimitPayload,
  UsageSummary,
  UsageByModel,
  UsageByProvider,
  DailyTrend,
} from '@/schemas/tokenQuotaSchema';

// ---------------------------------------------------------------------------
// Quotas
// ---------------------------------------------------------------------------

const QUOTAS = '/admin/quotas';

export async function fetchQuotas(): Promise<Quota[]> {
  const res: ApiResponse<Quota[]> = await apiClient.get(QUOTAS);
  return unwrap(res);
}

export async function createQuota(payload: CreateQuotaPayload): Promise<Quota> {
  const res: ApiResponse<Quota> = await apiClient.post(QUOTAS, payload);
  return unwrap(res);
}

export async function updateQuota(id: string, payload: CreateQuotaPayload): Promise<Quota> {
  await deleteQuota(id);
  return createQuota(payload);
}

export async function deleteQuota(id: string): Promise<void> {
  const res: ApiResponse<null> = await apiClient.delete(`${QUOTAS}/${id}`);
  unwrap(res);
}

export async function resetQuota(id: string): Promise<Quota> {
  const res: ApiResponse<Quota> = await apiClient.post(`${QUOTAS}/${id}/reset`);
  return unwrap(res);
}

// ---------------------------------------------------------------------------
// Rate Limits
// ---------------------------------------------------------------------------

const RATE_LIMITS = '/admin/rate-limits';

export async function fetchRateLimits(): Promise<RateLimitRule[]> {
  const res: ApiResponse<RateLimitRule[]> = await apiClient.get(RATE_LIMITS);
  return unwrap(res);
}

export async function createRateLimit(payload: CreateRateLimitPayload): Promise<RateLimitRule> {
  const res: ApiResponse<RateLimitRule> = await apiClient.post(RATE_LIMITS, payload);
  return unwrap(res);
}

export async function deleteRateLimit(id: string): Promise<void> {
  const res: ApiResponse<null> = await apiClient.delete(`${RATE_LIMITS}/${id}`);
  unwrap(res);
}

// ---------------------------------------------------------------------------
// Usage Statistics
// ---------------------------------------------------------------------------

const USAGE = '/admin/usage';

export async function fetchUsageSummary(start: string, end: string): Promise<UsageSummary> {
  const res: ApiResponse<UsageSummary> = await apiClient.get(`${USAGE}/summary`, {
    params: { start, end },
  });
  return unwrap(res);
}

export async function fetchUsageByModel(start: string, end: string): Promise<UsageByModel[]> {
  const res: ApiResponse<UsageByModel[]> = await apiClient.get(`${USAGE}/by-model`, {
    params: { start, end },
  });
  return unwrap(res);
}

export async function fetchUsageByProvider(start: string, end: string): Promise<UsageByProvider[]> {
  const res: ApiResponse<UsageByProvider[]> = await apiClient.get(`${USAGE}/by-provider`, {
    params: { start, end },
  });
  return unwrap(res);
}

export async function fetchDailyTrend(start: string, end: string): Promise<DailyTrend[]> {
  const res: ApiResponse<DailyTrend[]> = await apiClient.get(`${USAGE}/daily-trend`, {
    params: { start, end },
  });
  return unwrap(res);
}
