import { useQuery } from '@tanstack/react-query';
import { fetchAuthTemplates, fetchAuthTemplate } from '@/http/mcpManagerApi';
import { mcpQueryKeys } from './useMCPList';

export function useAuthTemplates() {
  return useQuery({
    queryKey: mcpQueryKeys.authTemplates(),
    queryFn: fetchAuthTemplates,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAuthTemplate(authType: string | undefined) {
  return useQuery({
    queryKey: mcpQueryKeys.authTemplate(authType ?? ''),
    queryFn: () => fetchAuthTemplate(authType!),
    enabled: !!authType && authType !== 'NONE',
    staleTime: 5 * 60 * 1000,
  });
}
