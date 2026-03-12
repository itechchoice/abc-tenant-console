import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { WorkflowExecutionViewer } from '@itechchoice/mcp-fe-shared/workflow-editor';
import { fetchWorkflowById } from '@/http/workflowApi';
import { useChatStore, selectActiveSessionId } from '@/stores/chatStore';
import ExecutionTimeline from '@/components/ExecutionTimeline';

interface WorkflowExecutionCardProps {
  workflowId: string;
  onNodeClick?: (nodeId: string) => void;
}

export function WorkflowExecutionCard({ workflowId, onNodeClick }: WorkflowExecutionCardProps) {
  const { data: workflow, isLoading, isError } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => fetchWorkflowById(workflowId),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const sessionId = useChatStore(selectActiveSessionId);
  const execution = useChatStore(
    (s) => s.sessions.get(sessionId)?.workflowExecutions.get(workflowId),
  );

  const nodeExecutionStates = useMemo(
    () => execution?.nodeStates ?? {},
    [execution?.nodeStates],
  );

  const executionStatus = execution?.executionStatus ?? 'running';
  const stepEvents = execution?.stepEvents ?? [];

  const handleViewerNodeClick = useCallback(
    (_event: React.MouseEvent, node: { id: string }) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick],
  );

  if (isLoading) {
    return (
      <div className="flex h-[320px] w-[750px] items-center justify-center rounded-xl border border-border/50 bg-muted/30">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !workflow?.definition) {
    if (stepEvents.length === 0) return null;

    return (
      <div className="w-[750px] rounded-xl border border-border/50 bg-muted/20 p-3">
        <ExecutionTimeline events={stepEvents} onNodeClick={onNodeClick} />
      </div>
    );
  }

  return (
    <div className="h-[320px] w-[750px] overflow-hidden rounded-xl border border-border/50 bg-background">
      <WorkflowExecutionViewer
        definition={workflow.definition}
        nodeExecutionStates={nodeExecutionStates}
        executionStatus={executionStatus}
        onNodeClick={handleViewerNodeClick}
        autoFocusRunningNode
        fitView
      />
    </div>
  );
}
