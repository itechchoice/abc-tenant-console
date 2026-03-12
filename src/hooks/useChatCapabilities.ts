import { useQuery } from '@tanstack/react-query';
import { fetchMcpServers, type McpServerCatalog } from '@/http/workflowApi';
import { fetchWorkflows } from '@/http/workflowApi';
import { workflowQueryKeys } from '@/pages/WorkflowList/hooks/useWorkflowList';
import type { WorkflowSummary } from '@/schemas/workflowEditorSchema';

export function useMcpTools() {
  return useQuery<McpServerCatalog[]>({
    queryKey: workflowQueryKeys.tools(),
    queryFn: fetchMcpServers,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublishedWorkflows() {
  return useQuery({
    queryKey: workflowQueryKeys.list({ status: 'published', size: 100 }),
    queryFn: () => fetchWorkflows({ status: 'published', size: 100 }),
    select: (page) => page.items as WorkflowSummary[],
    staleTime: 5 * 60 * 1000,
  });
}
