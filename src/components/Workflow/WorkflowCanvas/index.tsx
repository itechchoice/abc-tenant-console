import { ReactFlowProvider } from '@xyflow/react';
import { useMemo } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useWorkflowRuntimeStore } from '@/stores/workflowRuntimeStore';
import { cn } from '@/lib/utils';
import { ExecutionHeader } from './ExecutionHeader';
import { ExecutionInspector } from './ExecutionInspector';
import { ExecutionTimeline } from './ExecutionTimeline';
import { FlowViewport } from './FlowViewport';
import { buildGraphState } from './graph';

interface WorkflowCanvasProps {
  className?: string;
  fitViewTrigger?: number;
}

export function WorkflowCanvas({ className, fitViewTrigger = 0 }: WorkflowCanvasProps) {
  const chatMode = useChatStore((s) => s.chatMode);
  const phase = useWorkflowRuntimeStore((s) => s.phase);
  const status = useWorkflowRuntimeStore((s) => s.status);
  const steps = useWorkflowRuntimeStore((s) => s.steps);
  const currentStepId = useWorkflowRuntimeStore((s) => s.currentStepId);
  const selectedStepId = useWorkflowRuntimeStore((s) => s.selectedStepId);
  const followLive = useWorkflowRuntimeStore((s) => s.followLive);
  const setFollowLive = useWorkflowRuntimeStore((s) => s.setFollowLive);
  const selectStep = useWorkflowRuntimeStore((s) => s.selectStep);
  const resultSummary = useWorkflowRuntimeStore((s) => s.resultSummary);
  const lastCompletedSummary = useWorkflowRuntimeStore((s) => s.lastCompletedSummary);

  const currentStep = steps.find((step) => step.id === currentStepId) || null;
  const selectedStep = steps.find((step) => step.id === selectedStepId)
    || currentStep
    || steps[steps.length - 1]
    || null;

  const graph = useMemo(() => buildGraphState({
    chatMode,
    steps,
    currentStep,
    selectedStep,
    phase,
    status,
  }), [chatMode, currentStep, phase, selectedStep, status, steps]);

  if (phase === 'idle') {
    return null;
  }

  return (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden rounded-[28px] border border-slate-200/70 bg-[#f4f6fb] text-slate-900',
        className,
      )}
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.88),_transparent_48%)]" />

      <div className="relative flex h-full min-h-0 flex-col">
        <ExecutionHeader
          chatMode={chatMode}
          status={status}
          steps={steps}
          followLive={followLive}
          onToggleFollow={setFollowLive}
          selectedStep={selectedStep}
          summary={resultSummary || lastCompletedSummary}
        />

        <div className="h-[41%] min-h-[280px] border-b border-slate-200/70">
          <ReactFlowProvider>
            <FlowViewport graph={graph} fitViewTrigger={fitViewTrigger} />
          </ReactFlowProvider>
        </div>

        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
          <ExecutionTimeline
            steps={steps}
            selectedStepId={selectedStep?.id ?? null}
            onSelectStep={selectStep}
          />
          <ExecutionInspector
            step={selectedStep}
            summary={resultSummary || lastCompletedSummary}
            phase={phase}
          />
        </div>
      </div>
    </div>
  );
}
