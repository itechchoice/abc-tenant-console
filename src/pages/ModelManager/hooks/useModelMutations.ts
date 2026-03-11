import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createModelForProvider, updateModel, deleteModel, updateModelStatus } from '@/http/modelManagerApi';
import { modelManagerKeys } from './queryKeys';
import type { CreateModelPayload, UpdateModelPayload } from '@/schemas/modelManagerSchema';

export function useCreateModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ providerId, payload }: { providerId: string; payload: CreateModelPayload }) => createModelForProvider(providerId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: modelManagerKeys.models.all }),
  });
}

export function useUpdateModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateModelPayload }) => updateModel(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: modelManagerKeys.models.all }),
  });
}

export function useDeleteModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteModel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: modelManagerKeys.models.all });
      qc.invalidateQueries({ queryKey: modelManagerKeys.pools.all });
    },
  });
}

export function useUpdateModelStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => updateModelStatus(id, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: modelManagerKeys.models.all }),
  });
}
