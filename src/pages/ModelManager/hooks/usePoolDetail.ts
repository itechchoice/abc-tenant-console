import { useQuery } from '@tanstack/react-query';
import { fetchPoolDetail } from '@/http/modelManagerApi';
import { modelManagerKeys } from './queryKeys';

export function usePoolDetail(id: string | undefined) {
  return useQuery({
    queryKey: modelManagerKeys.pools.detail(id || ''),
    queryFn: () => fetchPoolDetail(id!),
    enabled: !!id,
  });
}
