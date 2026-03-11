import { z } from 'zod';

// ── Rate Limit ──────────────────────────────────────────────────────

export const RateLimitTargetTypeSchema = z.enum(['TENANT', 'MODEL']);
export type RateLimitTargetType = z.infer<typeof RateLimitTargetTypeSchema>;

export const RateLimitRuleSchema = z.object({
  id: z.string(),
  targetType: RateLimitTargetTypeSchema,
  targetId: z.string(),
  rpmLimit: z.number().nullable(),
  tpmLimit: z.number().nullable(),
});
export type RateLimitRule = z.infer<typeof RateLimitRuleSchema>;

export const CreateRateLimitPayloadSchema = z.object({
  targetType: RateLimitTargetTypeSchema,
  targetId: z.string().optional(),
  rpmLimit: z.number().min(1).optional(),
  tpmLimit: z.number().min(1).optional(),
});
export type CreateRateLimitPayload = z.infer<typeof CreateRateLimitPayloadSchema>;

// ── Token Quota ─────────────────────────────────────────────────────

export const QuotaTypeSchema = z.enum(['MONTHLY', 'DAILY']);
export type QuotaType = z.infer<typeof QuotaTypeSchema>;

export const QuotaSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  quotaType: QuotaTypeSchema,
  tokenLimit: z.number(),
  tokensUsed: z.number(),
  periodStart: z.string(),
});
export type Quota = z.infer<typeof QuotaSchema>;

export const CreateQuotaPayloadSchema = z.object({
  quotaType: QuotaTypeSchema,
  tokenLimit: z.number().min(1),
});
export type CreateQuotaPayload = z.infer<typeof CreateQuotaPayloadSchema>;

// ── Usage Statistics ────────────────────────────────────────────────

export const UsageSummarySchema = z.object({
  promptTokens: z.number(),
  completionTokens: z.number(),
  totalTokens: z.number(),
  totalCost: z.number(),
  requestCount: z.number(),
});
export type UsageSummary = z.infer<typeof UsageSummarySchema>;

export const UsageByModelSchema = z.object({
  modelId: z.string(),
  totalTokens: z.number(),
  totalCost: z.number(),
  requestCount: z.number(),
});
export type UsageByModel = z.infer<typeof UsageByModelSchema>;

export const UsageByProviderSchema = z.object({
  providerType: z.string(),
  totalTokens: z.number(),
  totalCost: z.number(),
  requestCount: z.number(),
});
export type UsageByProvider = z.infer<typeof UsageByProviderSchema>;

export const DailyTrendSchema = z.object({
  date: z.string(),
  totalTokens: z.number(),
  totalCost: z.number(),
  requestCount: z.number(),
});
export type DailyTrend = z.infer<typeof DailyTrendSchema>;

// ── Constants ───────────────────────────────────────────────────────

export const QUOTA_TYPE_OPTIONS: { label: string; value: QuotaType }[] = [
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Daily', value: 'DAILY' },
];

export const RATE_LIMIT_TARGET_OPTIONS: { label: string; value: RateLimitTargetType }[] = [
  { label: 'Tenant', value: 'TENANT' },
  { label: 'Model', value: 'MODEL' },
];
