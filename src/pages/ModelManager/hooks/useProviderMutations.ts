import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProvider, updateProvider, deleteProvider, updateProviderStatus } from '@/http/modelManagerApi';
import { modelManagerKeys } from './queryKeys';
import type { CreateProviderPayload, UpdateProviderPayload } from '@/schemas/modelManagerSchema';

export function useCreateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: CreateProviderPayload) => createProvider(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: modelManagerKeys.providers.lists() }),
  });
}

export function useUpdateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProviderPayload }) => updateProvider(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: modelManagerKeys.providers.all });
    },
  });
}

export function useDeleteProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProvider(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: modelManagerKeys.providers.lists() });
      qc.invalidateQueries({ queryKey: modelManagerKeys.models.all });
      qc.invalidateQueries({ queryKey: modelManagerKeys.pools.all });
    },
  });
}

export function useUpdateProviderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => updateProviderStatus(id, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: modelManagerKeys.providers.all }),
  });
}
