import { useQuery } from '@tanstack/react-query';
import { fetchModelsByProvider, fetchAllModels, fetchModelDetail } from '@/http/modelManagerApi';
import { modelManagerKeys } from './queryKeys';

export function useModelsByProvider(providerId: string | undefined) {
  return useQuery({
    queryKey: modelManagerKeys.models.byProvider(providerId || ''),
    queryFn: () => fetchModelsByProvider(providerId!, { size: 100 }),
    enabled: !!providerId,
  });
}

export function useAllModels(params?: { modelType?: string; enabled?: boolean }) {
  return useQuery({
    queryKey: modelManagerKeys.models.allList(params as Record<string, unknown>),
    queryFn: () => fetchAllModels({ size: 200, ...params }),
  });
}

export function useModelDetail(id: string | undefined) {
  return useQuery({
    queryKey: modelManagerKeys.models.detail(id || ''),
    queryFn: () => fetchModelDetail(id!),
    enabled: !!id,
  });
}
