import { useQuery } from '@tanstack/react-query';
import { fetchWorkflowById } from '@/http/workflowApi';
import { workflowQueryKeys } from '../../WorkflowList/hooks/useWorkflowList';

export function useWorkflowDetail(id: string | undefined) {
  return useQuery({
    queryKey: workflowQueryKeys.detail(id ?? ''),
    queryFn: () => fetchWorkflowById(id!),
    enabled: !!id && id !== 'new',
  });
}
