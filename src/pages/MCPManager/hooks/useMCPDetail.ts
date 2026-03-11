import { useQuery } from '@tanstack/react-query';
import { fetchMCPDetail } from '@/http/mcpManagerApi';
import { mcpQueryKeys } from './useMCPList';

export function useMCPDetail(serverId: string | undefined) {
  return useQuery({
    queryKey: mcpQueryKeys.detail(serverId ?? ''),
    queryFn: () => fetchMCPDetail(serverId!),
    enabled: !!serverId,
  });
}
