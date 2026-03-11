import dayjs from 'dayjs';
import type {
  RateLimitRule,
  CreateRateLimitPayload,
  Quota,
  CreateQuotaPayload,
  UsageSummary,
  UsageByModel,
  UsageByProvider,
  DailyTrend,
} from '@/schemas/tokenQuotaSchema';

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
let nextId = 100;
const genId = () => String(++nextId);

// ── Rate Limit seed data ────────────────────────────────────────────

let rateLimits: RateLimitRule[] = [
  { id: '1', targetType: 'TENANT', targetId: '1001', rpmLimit: 120, tpmLimit: 200000 },
  { id: '2', targetType: 'MODEL', targetId: 'gpt-4o-mini', rpmLimit: 60, tpmLimit: null },
  { id: '3', targetType: 'MODEL', targetId: 'claude-3-haiku-20240307', rpmLimit: 40, tpmLimit: 80000 },
  { id: '4', targetType: 'MODEL', targetId: 'deepseek-chat', rpmLimit: null, tpmLimit: 150000 },
];

export async function fetchRateLimits(): Promise<RateLimitRule[]> {
  await delay();
  return [...rateLimits];
}

export async function createRateLimit(payload: CreateRateLimitPayload): Promise<RateLimitRule> {
  await delay(400);
  const rule: RateLimitRule = {
    id: genId(),
    targetType: payload.targetType,
    targetId: payload.targetId ?? '',
    rpmLimit: payload.rpmLimit ?? null,
    tpmLimit: payload.tpmLimit ?? null,
  };
  rateLimits = [...rateLimits, rule];
  return rule;
}

export async function deleteRateLimit(id: string): Promise<void> {
  await delay(300);
  rateLimits = rateLimits.filter((r) => r.id !== id);
}

// ── Quota seed data ─────────────────────────────────────────────────

let quotas: Quota[] = [
  {
    id: '10',
    tenantId: '1001',
    quotaType: 'MONTHLY',
    tokenLimit: 1000000,
    tokensUsed: 327450,
    periodStart: dayjs().startOf('month').format('YYYY-MM-DD'),
  },
  {
    id: '11',
    tenantId: '1001',
    quotaType: 'DAILY',
    tokenLimit: 50000,
    tokensUsed: 12300,
    periodStart: dayjs().format('YYYY-MM-DD'),
  },
];

export async function fetchQuotas(): Promise<Quota[]> {
  await delay();
  return [...quotas];
}

export async function createQuota(payload: CreateQuotaPayload): Promise<Quota> {
  await delay(400);
  const quota: Quota = {
    id: genId(),
    tenantId: '1001',
    quotaType: payload.quotaType,
    tokenLimit: payload.tokenLimit,
    tokensUsed: 0,
    periodStart: payload.quotaType === 'MONTHLY'
      ? dayjs().startOf('month').format('YYYY-MM-DD')
      : dayjs().format('YYYY-MM-DD'),
  };
  quotas = [...quotas, quota];
  return quota;
}

export async function updateQuota(id: string, payload: CreateQuotaPayload): Promise<Quota> {
  await delay(400);
  quotas = quotas.map((q) =>
    q.id === id ? { ...q, quotaType: payload.quotaType, tokenLimit: payload.tokenLimit } : q,
  );
  const found = quotas.find((q) => q.id === id);
  if (!found) throw new Error('Quota not found');
  return found;
}

export async function deleteQuota(id: string): Promise<void> {
  await delay(300);
  quotas = quotas.filter((q) => q.id !== id);
}

export async function resetQuota(id: string): Promise<Quota> {
  await delay(400);
  quotas = quotas.map((q) =>
    q.id === id
      ? { ...q, tokensUsed: 0, periodStart: dayjs().startOf('month').format('YYYY-MM-DD') }
      : q,
  );
  const found = quotas.find((q) => q.id === id);
  if (!found) throw new Error('Quota not found');
  return found;
}

// ── Usage Statistics seed data ──────────────────────────────────────

function generateDailyData(start: string, end: string): DailyTrend[] {
  const days: DailyTrend[] = [];
  let current = dayjs(start);
  const endDate = dayjs(end);
  while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
    const base = 3000 + Math.floor(Math.random() * 8000);
    days.push({
      date: current.format('YYYY-MM-DD'),
      totalTokens: base,
      totalCost: +(base * 0.001).toFixed(4),
      requestCount: 20 + Math.floor(Math.random() * 80),
    });
    current = current.add(1, 'day');
  }
  return days;
}

export async function fetchUsageSummary(
  _start: string,
  _end: string,
): Promise<UsageSummary> {
  await delay(400);
  return {
    promptTokens: 185400,
    completionTokens: 92700,
    totalTokens: 278100,
    totalCost: 0.2781,
    requestCount: 1520,
  };
}

export async function fetchUsageByModel(
  _start: string,
  _end: string,
): Promise<UsageByModel[]> {
  await delay(400);
  return [
    { modelId: 'gpt-4o-mini', totalTokens: 120000, totalCost: 0.12, requestCount: 800 },
    { modelId: 'claude-3-haiku-20240307', totalTokens: 85000, totalCost: 0.085, requestCount: 420 },
    { modelId: 'deepseek-chat', totalTokens: 53100, totalCost: 0.053, requestCount: 210 },
    { modelId: 'gpt-4o', totalTokens: 20000, totalCost: 0.02, requestCount: 90 },
  ];
}

export async function fetchUsageByProvider(
  _start: string,
  _end: string,
): Promise<UsageByProvider[]> {
  await delay(400);
  return [
    { providerType: 'OPENAI', totalTokens: 140000, totalCost: 0.14, requestCount: 890 },
    { providerType: 'ANTHROPIC', totalTokens: 85000, totalCost: 0.085, requestCount: 420 },
    { providerType: 'DEEPSEEK', totalTokens: 53100, totalCost: 0.053, requestCount: 210 },
  ];
}

export async function fetchDailyTrend(
  start: string,
  end: string,
): Promise<DailyTrend[]> {
  await delay(500);
  return generateDailyData(start, end);
}
