import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPool, updatePool, deletePool } from '@/http/modelManagerApi';
import { modelManagerKeys } from './queryKeys';
import type { CreatePoolPayload, UpdatePoolPayload } from '@/schemas/modelManagerSchema';

export function useCreatePool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: CreatePoolPayload) => createPool(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: modelManagerKeys.pools.list() }),
  });
}

export function useUpdatePool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePoolPayload }) => updatePool(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: modelManagerKeys.pools.all }),
  });
}

export function useDeletePool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePool(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: modelManagerKeys.pools.all }),
  });
}
