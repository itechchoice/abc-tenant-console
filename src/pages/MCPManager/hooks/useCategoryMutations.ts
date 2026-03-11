import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory, updateCategory, deleteCategory } from '@/http/mcpManagerApi';
import { mcpQueryKeys } from './useMCPList';

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => createCategory(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mcpQueryKeys.categories() });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, code }: { id: string; code: string }) => updateCategory(id, code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mcpQueryKeys.categories() });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mcpQueryKeys.categories() });
    },
  });
}
