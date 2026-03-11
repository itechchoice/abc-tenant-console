import { useQuery } from '@tanstack/react-query';
import { fetchPools } from '@/http/modelManagerApi';
import { modelManagerKeys } from './queryKeys';

export function usePoolList() {
  return useQuery({
    queryKey: modelManagerKeys.pools.list(),
    queryFn: fetchPools,
  });
}
