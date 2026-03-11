import { useQuery } from '@tanstack/react-query';
import { fetchProviderDetail } from '@/http/modelManagerApi';
import { modelManagerKeys } from './queryKeys';

export function useProviderDetail(id: string | undefined) {
  return useQuery({
    queryKey: modelManagerKeys.providers.detail(id || ''),
    queryFn: () => fetchProviderDetail(id!),
    enabled: !!id,
  });
}
