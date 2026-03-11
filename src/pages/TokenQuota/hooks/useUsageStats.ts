import { useQuery } from '@tanstack/react-query';
import {
  fetchUsageSummary,
  fetchUsageByModel,
  fetchUsageByProvider,
  fetchDailyTrend,
} from '@/http/tokenQuotaApi';
import { tokenQuotaKeys } from './queryKeys';

export function useUsageSummary(start: string, end: string) {
  return useQuery({
    queryKey: tokenQuotaKeys.usageSummary(start, end),
    queryFn: () => fetchUsageSummary(start, end),
  });
}

export function useUsageByModel(start: string, end: string) {
  return useQuery({
    queryKey: tokenQuotaKeys.usageByModel(start, end),
    queryFn: () => fetchUsageByModel(start, end),
  });
}

export function useUsageByProvider(start: string, end: string) {
  return useQuery({
    queryKey: tokenQuotaKeys.usageByProvider(start, end),
    queryFn: () => fetchUsageByProvider(start, end),
  });
}

export function useDailyTrend(start: string, end: string) {
  return useQuery({
    queryKey: tokenQuotaKeys.dailyTrend(start, end),
    queryFn: () => fetchDailyTrend(start, end),
  });
}
