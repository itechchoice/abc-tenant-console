import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAssignedProviders } from '@/http/modelApi';
import { useChatStore } from '@/stores/chatStore';
import type { AssignedProvider } from '@/schemas/modelSchema';

export const modelQueryKeys = {
  assignedProviders: ['models', 'providers', 'assigned'] as const,
};

export function useAssignedModels() {
  const query = useQuery<AssignedProvider[]>({
    queryKey: [...modelQueryKeys.assignedProviders],
    queryFn: fetchAssignedProviders,
  });

  useEffect(() => {
    if (!query.data?.length) return;
    const { selectedModel } = useChatStore.getState();
    if (!selectedModel) {
      useChatStore.getState().setSelectedModel(query.data[0]);
    }
  }, [query.data]);

  return query;
}
