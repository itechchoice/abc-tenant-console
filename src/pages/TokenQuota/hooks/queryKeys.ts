export const tokenQuotaKeys = {
  rateLimits: ['rate-limits'] as const,
  quotas: ['quotas'] as const,
  usageSummary: (start: string, end: string) => ['usage', 'summary', start, end] as const,
  usageByModel: (start: string, end: string) => ['usage', 'by-model', start, end] as const,
  usageByProvider: (start: string, end: string) => ['usage', 'by-provider', start, end] as const,
  dailyTrend: (start: string, end: string) => ['usage', 'daily-trend', start, end] as const,
};
