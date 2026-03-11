import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CreateGroupPayload, UpdateGroupPayload } from '@/schemas/workflowEditorSchema';
import {
  fetchGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  addWorkflowToGroup,
  removeWorkflowFromGroup,
  fetchWorkflowGroups,
} from '@/http/workflowApi';
import { workflowQueryKeys } from './useWorkflowList';

const groupKeys = {
  all: () => workflowQueryKeys.groups(),
  byWorkflow: (wfId: string) => [...workflowQueryKeys.groups(), 'by-workflow', wfId] as const,
};

export function useGroupList() {
  return useQuery({
    queryKey: groupKeys.all(),
    queryFn: () => fetchGroups({ size: 100 }),
  });
}

export function useWorkflowGroupsBelonging(workflowId: string | undefined) {
  return useQuery({
    queryKey: groupKeys.byWorkflow(workflowId ?? ''),
    queryFn: () => fetchWorkflowGroups(workflowId!),
    enabled: !!workflowId,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGroupPayload) => createGroup(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.all() });
      toast.success('Group created');
    },
    onError: (err) => {
      toast.error(`Create group failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateGroupPayload }) =>
      updateGroup(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.all() });
      toast.success('Group updated');
    },
    onError: (err) => {
      toast.error(`Update group failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.all() });
      toast.success('Group deleted');
    },
    onError: (err) => {
      toast.error(`Delete group failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
  });
}

export function useAddWorkflowToGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, workflowId }: { groupId: string; workflowId: string }) =>
      addWorkflowToGroup(groupId, workflowId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowQueryKeys.lists() });
      qc.invalidateQueries({ queryKey: groupKeys.all() });
      toast.success('Workflow added to group');
    },
    onError: (err) => {
      toast.error(`Add to group failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
  });
}

export function useRemoveWorkflowFromGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, workflowId }: { groupId: string; workflowId: string }) =>
      removeWorkflowFromGroup(groupId, workflowId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowQueryKeys.lists() });
      qc.invalidateQueries({ queryKey: groupKeys.all() });
      toast.success('Workflow removed from group');
    },
    onError: (err) => {
      toast.error(`Remove from group failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
  });
}
