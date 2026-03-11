import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CreateWorkflowPayload } from '@/schemas/workflowEditorSchema';
import {
  createWorkflow,
  deleteWorkflow,
  publishWorkflow,
  unpublishWorkflow,
} from '@/http/workflowApi';
import { workflowQueryKeys } from './useWorkflowList';

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWorkflowPayload) => createWorkflow(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowQueryKeys.lists() });
      toast.success('Workflow created');
    },
    onError: (err) => {
      toast.error(`Create failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWorkflow(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowQueryKeys.lists() });
      toast.success('Workflow deleted');
    },
    onError: (err) => {
      toast.error(`Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
  });
}

export function usePublishWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publishWorkflow(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowQueryKeys.lists() });
      toast.success('Workflow published');
    },
    onError: (err) => {
      toast.error(`Publish failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
  });
}

export function useUnpublishWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unpublishWorkflow(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowQueryKeys.lists() });
      toast.success('Workflow unpublished');
    },
    onError: (err) => {
      toast.error(`Unpublish failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
  });
}
