import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createQuota, updateQuota, deleteQuota, resetQuota } from '@/http/tokenQuotaApi';
import { tokenQuotaKeys } from './queryKeys';
import type { CreateQuotaPayload } from '@/schemas/tokenQuotaSchema';

export function useCreateQuota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateQuotaPayload) => createQuota(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: tokenQuotaKeys.quotas }),
  });
}

export function useUpdateQuota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateQuotaPayload }) =>
      updateQuota(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: tokenQuotaKeys.quotas }),
  });
}

export function useDeleteQuota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteQuota(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: tokenQuotaKeys.quotas }),
  });
}

export function useResetQuota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resetQuota(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: tokenQuotaKeys.quotas }),
  });
}
