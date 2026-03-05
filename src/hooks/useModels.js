import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/http/client';
import { useChatStore } from '@/stores/chatStore';
import { AssignedProviderSchema } from '@/schemas/modelSchema';

/**
 * @typedef {import('@/schemas/modelSchema').AssignedProvider} AssignedProvider
 */

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const modelQueryKeys = {
  assignedProviders: ['models', 'providers', 'assigned'],
};

// ---------------------------------------------------------------------------
// useAssignedModels
// ---------------------------------------------------------------------------

/**
 * Fetches the tenant-scoped list of available LLM providers from
 * `GET /models/providers/assigned`.
 *
 * Response is validated through the `AssignedProviderSchema` Zod guard.
 * On first successful load, auto-selects the first provider when the
 * store's `selectedModel` is empty.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult<AssignedProvider[]>}
 */
export function useAssignedModels() {
  const query = useQuery({
    queryKey: modelQueryKeys.assignedProviders,
    queryFn: async () => {
      const res = await apiClient.get('/models/providers/assigned');
      const raw = Array.isArray(res) ? res : (res?.data ?? []);
      try {
        return z.array(AssignedProviderSchema).parse(raw);
      } catch (err) {
        console.warn('[useAssignedModels] Zod validation fell through:', err);
        return raw;
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
