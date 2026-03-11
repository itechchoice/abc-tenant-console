import { useQuery } from '@tanstack/react-query';
import { fetchRateLimits } from '@/http/tokenQuotaApi';
import { tokenQuotaKeys } from './queryKeys';

export function useRateLimits() {
  return useQuery({
    queryKey: tokenQuotaKeys.rateLimits,
    queryFn: fetchRateLimits,
  });
}
