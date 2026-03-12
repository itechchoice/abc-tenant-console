import { useQuery } from '@tanstack/react-query';
import { useMcpManagerStore } from '@/stores/mcpManagerStore';
import { fetchMCPList, fetchUserConnectionServers, fetchUserMcpDisplay } from '@/http/mcpManagerApi';
import type { McpListResponse, McpServer } from '@/schemas/mcpManagerSchema';
import type { UserConnectionServer, UserMcpDisplay } from '@/http/mcpManagerApi';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export interface McpServerWithConnection extends McpServer {
  userConnection?: UserConnectionServer;
  userDisplay?: UserMcpDisplay;
}

export interface McpListWithConnectionResponse extends Omit<McpListResponse, 'content'> {
  content: McpServerWithConnection[];
}

export const mcpQueryKeys = {
  all: ['mcp'] as const,
  lists: () => [...mcpQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...mcpQueryKeys.lists(), filters] as const,
  details: () => [...mcpQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...mcpQueryKeys.details(), id] as const,
  categories: () => [...mcpQueryKeys.all, 'categories'] as const,
  authTemplates: () => [...mcpQueryKeys.all, 'auth-templates'] as const,
  authTemplate: (authType: string) => [...mcpQueryKeys.authTemplates(), authType] as const,
  serverAuthParams: (serverId: string) => [...mcpQueryKeys.all, 'auth-params', serverId] as const,
  serverAuthConfig: (serverId: string) => [...mcpQueryKeys.all, 'auth-config', serverId] as const,
};

export function useMCPList() {
  const { page, pageSize, searchValue, selectedCategoryCode } = useMcpManagerStore();
  const debouncedSearch = useDebouncedValue(searchValue);

  return useQuery<McpListWithConnectionResponse>({
    queryKey: mcpQueryKeys.list({ page, pageSize, searchValue: debouncedSearch, selectedCategoryCode }),
    queryFn: async () => {
      const [listRes, connections, displayList] = await Promise.all([
        fetchMCPList({
          page,
          size: pageSize,
          name: debouncedSearch || undefined,
          categoryCode: selectedCategoryCode || undefined,
        }),
        fetchUserConnectionServers().catch(() => [] as UserConnectionServer[]),
        fetchUserMcpDisplay().catch(() => [] as UserMcpDisplay[]),
      ]);

      const connectionMap = new Map(connections.map((c) => [String(c.serverId), c]));
      const displayMap = new Map(displayList.map((d) => [String(d.serverId), d]));

      return {
        ...listRes,
        content: listRes.content.map((server) => ({
          ...server,
          userConnection: connectionMap.get(server.id),
          userDisplay: displayMap.get(server.id),
        })),
      };
    },
  });
}
