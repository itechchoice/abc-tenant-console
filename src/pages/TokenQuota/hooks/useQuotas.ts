import { useQuery } from '@tanstack/react-query';
import { fetchQuotas } from '@/http/tokenQuotaApi';
import { tokenQuotaKeys } from './queryKeys';

export function useQuotas() {
  return useQuery({
    queryKey: tokenQuotaKeys.quotas,
    queryFn: fetchQuotas,
  });
}
