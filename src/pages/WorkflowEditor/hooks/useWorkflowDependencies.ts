import { useQuery } from '@tanstack/react-query';
import { checkDependencies } from '@/http/workflowApi';
import { workflowQueryKeys } from '../../WorkflowList/hooks/useWorkflowList';

export function useWorkflowDependencies(workflowId: string | undefined, enabled = false) {
  return useQuery({
    queryKey: workflowQueryKeys.dependencies(workflowId ?? ''),
    queryFn: () => checkDependencies(workflowId!),
    enabled: !!workflowId && enabled,
  });
}
