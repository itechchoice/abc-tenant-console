import { useQuery } from '@tanstack/react-query';
import { useMcpManagerStore } from '@/stores/mcpManagerStore';
import { fetchMCPList } from '@/http/mcpManagerApi';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

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

  return useQuery({
    queryKey: mcpQueryKeys.list({ page, pageSize, searchValue: debouncedSearch, selectedCategoryCode }),
    queryFn: () => fetchMCPList({
      page,
      size: pageSize,
      name: debouncedSearch || undefined,
      categoryCode: selectedCategoryCode || undefined,
    }),
  });
}
