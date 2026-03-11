import { useCallback, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { convertToDsl, type CanvasAreaHandle } from '@itechchoice/mcp-fe-shared/workflow-editor';
import { toast } from 'sonner';
import { useWorkflowEditorLocalStore } from '@/stores/workflowEditorStore';
import { updateWorkflow, publishWorkflow, unpublishWorkflow } from '@/http/workflowApi';
import { workflowQueryKeys } from '../../WorkflowList/hooks/useWorkflowList';
import { useWorkflowDetail } from './useWorkflowDetail';
import type { ApiEdge } from '@/schemas/workflowEditorSchema';

function stripEdgeIds(edges: Array<{ id?: string; source: string; target: string }>): ApiEdge[] {
  return edges.map(({ source, target }) => ({ source, target }));
}

export function useWorkflowEditor() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { setCurrentWorkflowId, setDirty, resetEditor } = useWorkflowEditorLocalStore();

  const { data: workflow, isLoading } = useWorkflowDetail(id);

  const canvasRef = useRef<CanvasAreaHandle | null>(null);

  useEffect(() => {
    setCurrentWorkflowId(id ?? null);
    return () => resetEditor();
  }, [id, setCurrentWorkflowId, resetEditor]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Workflow ID is required');
      const flowData = canvasRef.current?.getWorkflowData();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw: any = flowData ? convertToDsl(flowData as any) : { nodes: [], edges: [] };
      const definition = {
        nodes: raw.nodes,
        edges: stripEdgeIds(raw.edges ?? []),
      };

      return updateWorkflow(id, {
        name: workflow?.name,
        description: workflow?.description,
        definition,
      });
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: workflowQueryKeys.lists() });
      qc.invalidateQueries({ queryKey: workflowQueryKeys.detail(saved.id) });
      setDirty(false);
      toast.success('Workflow saved');
    },
    onError: (err) => {
      toast.error(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
  });

  const handleSave = useCallback(() => saveMutation.mutate(), [saveMutation]);

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      return publishWorkflow(id);
    },
    onSuccess: () => {
      if (id) {
        qc.invalidateQueries({ queryKey: workflowQueryKeys.detail(id) });
        qc.invalidateQueries({ queryKey: workflowQueryKeys.lists() });
      }
      toast.success('Workflow published');
    },
    onError: (err) => {
      toast.error(`Publish failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      return unpublishWorkflow(id);
    },
    onSuccess: () => {
      if (id) {
        qc.invalidateQueries({ queryKey: workflowQueryKeys.detail(id) });
        qc.invalidateQueries({ queryKey: workflowQueryKeys.lists() });
      }
      toast.success('Workflow unpublished');
    },
    onError: (err) => {
      toast.error(`Unpublish failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
  });

  const handlePublish = useCallback(() => {
    if (workflow?.status === 'published') {
      unpublishMutation.mutate();
    } else {
      const flowData = canvasRef.current?.getWorkflowData();
      const nodes = flowData?.nodes ?? [];
      if (nodes.length === 0) {
        toast.error('Cannot publish an empty canvas. Add at least one node first.');
        return;
      }
      publishMutation.mutate();
    }
  }, [workflow?.status, publishMutation, unpublishMutation, canvasRef]);

  const updateInfoMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      if (!id) throw new Error('Workflow ID is required');
      return updateWorkflow(id, { name, description });
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: workflowQueryKeys.detail(saved.id) });
      qc.invalidateQueries({ queryKey: workflowQueryKeys.lists() });
      toast.success('Workflow info updated');
    },
    onError: (err) => {
      toast.error(`Update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
  });

  const handleInfoSave = useCallback((name: string, description: string) => {
    updateInfoMutation.mutate({ name, description });
  }, [updateInfoMutation]);

  const handleExport = useCallback(() => {
    const data = canvasRef.current?.getWorkflowData();
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow?.name ?? 'workflow'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [workflow?.name]);

  return {
    id,
    workflow,
    isLoading,
    canvasRef,
    saveMutation,
    handleSave,
    handlePublish,
    handleInfoSave,
    handleExport,
  };
}
