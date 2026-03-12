import { useQuery } from '@tanstack/react-query';
import { fetchMcpServers, type McpServerCatalog } from '@/http/workflowApi';
import { workflowQueryKeys } from '../../WorkflowList/hooks/useWorkflowList';

export function useToolsList() {
  return useQuery<McpServerCatalog[]>({
    queryKey: workflowQueryKeys.tools(),
    queryFn: fetchMcpServers,
    staleTime: 5 * 60 * 1000,
  });
}
