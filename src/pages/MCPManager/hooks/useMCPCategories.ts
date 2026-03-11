import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '@/http/mcpManagerApi';
import { mcpQueryKeys } from './useMCPList';

export function useMCPCategories() {
  return useQuery({
    queryKey: mcpQueryKeys.categories(),
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });
}
