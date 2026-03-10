import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/http/client';
import { useChatStore } from '@/stores/chatStore';
import { AssignedProviderSchema } from '@/schemas/modelSchema';
import type { AssignedProvider } from '@/schemas/modelSchema';

export const modelQueryKeys = {
  assignedProviders: ['models', 'providers', 'assigned'] as const,
};

export function useAssignedModels() {
  const query = useQuery<AssignedProvider[]>({
    queryKey: [...modelQueryKeys.assignedProviders],
    queryFn: async () => {
      const res = await apiClient.get('/models/providers/assigned') as unknown;
      const raw = Array.isArray(res) ? res : ((res as { data?: unknown })?.data ?? []);
      try {
        return z.array(AssignedProviderSchema).parse(raw);
      } catch (err) {
        console.warn('[useAssignedModels] Zod validation fell through:', err);
        return raw as AssignedProvider[];
      }
    },
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
