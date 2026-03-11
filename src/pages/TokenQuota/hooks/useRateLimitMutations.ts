import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRateLimit, deleteRateLimit } from '@/http/tokenQuotaApi';
import { tokenQuotaKeys } from './queryKeys';
import type { CreateRateLimitPayload } from '@/schemas/tokenQuotaSchema';

export function useCreateRateLimit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRateLimitPayload) => createRateLimit(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: tokenQuotaKeys.rateLimits }),
  });
}

export function useDeleteRateLimit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRateLimit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: tokenQuotaKeys.rateLimits }),
  });
}
