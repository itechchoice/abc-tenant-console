import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWorkflowRuns, fetchRunDetail, runWorkflow, testRunWorkflow } from '@/http/workflowApi';
import { workflowQueryKeys } from '../../WorkflowList/hooks/useWorkflowList';

export function useWorkflowRunHistory(workflowId: string | undefined, page = 1, size = 20) {
  return useQuery({
    queryKey: [...workflowQueryKeys.runs(workflowId ?? ''), { page, size }],
    queryFn: () => fetchWorkflowRuns(workflowId!, { page, size }),
    enabled: !!workflowId,
  });
}

export function useRunDetail(taskId: string | undefined) {
  return useQuery({
    queryKey: workflowQueryKeys.runDetail(taskId ?? ''),
    queryFn: () => fetchRunDetail(taskId!),
    enabled: !!taskId,
  });
}

export function useRunWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workflowId: string) => runWorkflow(workflowId),
    onSuccess: (_data, workflowId) => {
      qc.invalidateQueries({ queryKey: workflowQueryKeys.runs(workflowId) });
    },
  });
}

export function useTestRunWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workflowId, message, modelId }: {
      workflowId: string;
      message?: string;
      modelId?: string;
    }) => testRunWorkflow(workflowId, { message, modelId }),
    onSuccess: (_data, { workflowId }) => {
      qc.invalidateQueries({ queryKey: workflowQueryKeys.runs(workflowId) });
    },
  });
}
