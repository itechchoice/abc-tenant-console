import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { motion } from 'framer-motion';
import {
  BrainCircuit,
  Crosshair,
  GitBranch,
  MessageSquareQuote,
  Orbit,
  Wrench,
} from 'lucide-react';
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useChatStore } from '@/stores/chatStore';
import { useWorkflowRuntimeStore } from '@/stores/workflowRuntimeStore';
import { AgentNode } from '@/components/Workflow/nodes/AgentNode';
import { cn } from '@/lib/utils';

const NODE_TYPES = { agent: AgentNode };

const FIT_VIEW_OPTS = {
  duration: 260,
  maxZoom: 1.08,
  padding: 0.45,
};

const AGENT_BLUEPRINT = [
  {
    id: 'understand',
    position: { x: 40, y: 40 },
    label: 'Understand',
    subtitle: 'Intent parsing',
    type: 'analysis',
    detail: 'Interpreting the user request and context.',
  },
  {
    id: 'plan',
    position: { x: 220, y: 146 },
    label: 'Plan',
    subtitle: 'Execution route',
    type: 'plan',
    detail: 'Choosing the path and preparing the task.',
  },
  {
    id: 'retrieve',
    position: { x: 64, y: 276 },
    label: 'Retrieve',
    subtitle: 'Tool calls',
    type: 'tool',
    detail: 'Collecting external evidence and tool output.',
  },
  {
    id: 'decide',
    position: { x: 224, y: 410 },
    label: 'Decide',
    subtitle: 'Synthesis',
    type: 'decision',
    detail: 'Combining evidence into a final decision.',
  },
  {
    id: 'ask-user',
    position: { x: 52, y: 552 },
    label: 'Ask User',
    subtitle: 'Human checkpoint',
    type: 'handoff',
    detail: 'Pausing for a missing confirmation or form input.',
  },
  {
    id: 'respond',
    position: { x: 232, y: 678 },
    label: 'Respond',
    subtitle: 'Answer delivery',
    type: 'response',
    detail: 'Streaming the final answer back to the chat.',
  },
];

const AGENT_EDGES = [
  { id: 'understand-plan', source: 'understand', target: 'plan' },
  { id: 'plan-retrieve', source: 'plan', target: 'retrieve' },
  { id: 'retrieve-decide', source: 'retrieve', target: 'decide' },
  { id: 'decide-respond', source: 'decide', target: 'respond' },
  { id: 'decide-ask-user', source: 'decide', target: 'ask-user' },
  { id: 'ask-user-respond', source: 'ask-user', target: 'respond' },
];

const MODEL_BLUEPRINT = [
  {
    id: 'prompt',
    position: { x: 48, y: 84 },
    label: 'Prompt',
    subtitle: 'Request framing',
    type: 'analysis',
    detail: 'Preparing the prompt and request metadata.',
  },
  {
    id: 'model',
    position: { x: 218, y: 224 },
    label: 'Model',
    subtitle: 'Inference',
    type: 'model',
    detail: 'Running the selected model directly.',
  },
  {
    id: 'response',
    position: { x: 48, y: 382 },
    label: 'Response',
    subtitle: 'Delivery',
    type: 'response',
    detail: 'Streaming the answer into the conversation.',
  },
];

const MODEL_EDGES = [
  { id: 'prompt-model', source: 'prompt', target: 'model' },
  { id: 'model-response', source: 'model', target: 'response' },
];

const MODE_LABELS = {
  auto: 'Auto',
  agent: 'Agent',
  model: 'Model',
};

const STATUS_LABELS = {
  idle: 'Idle',
  preparing: 'Preparing execution',
  running: 'Running',
  waiting: 'Waiting for your input',
  completed: 'Completed',
  failed: 'Failed',
};

const STATUS_TONES = {
  idle: 'bg-white/80 text-slate-600 border-slate-200/70',
  preparing: 'bg-slate-900 text-white border-slate-900',
  running: 'bg-sky-50 text-sky-700 border-sky-200',
  waiting: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
};

const TIMELINE_ICONS = {
  phase: GitBranch,
  tool: Wrench,
  interaction: MessageSquareQuote,
  system: Orbit,
};

function formatDuration(durationMs) {
  if (!durationMs) return '0s';
  if (durationMs < 1000) return `${durationMs}ms`;
  const seconds = Math.round(durationMs / 100) / 10;
  return `${seconds}s`;
}

function formatClock(timestamp) {
  if (!timestamp) return '--:--';
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPayload(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getBlueprint(chatMode) {
  return chatMode === 'model'
    ? { nodes: MODEL_BLUEPRINT, edges: MODEL_EDGES }
    : { nodes: AGENT_BLUEPRINT, edges: AGENT_EDGES };
}

function getVisitedNodeIds(steps) {
  return [...new Set(steps.map((step) => step.nodeKey))];
}

function getNodeStatus({
  nodeId,
  steps,
  currentStep,
  phase,
  status,
}) {
  const nodeSteps = steps.filter((step) => step.nodeKey === nodeId);
  const latestStep = nodeSteps[nodeSteps.length - 1];

  if (latestStep?.status === 'failed') return 'error';
  if (currentStep?.nodeKey === nodeId && status === 'waiting') return 'paused';
  if (currentStep?.nodeKey === nodeId) return 'running';
  if (!nodeSteps.length) return 'idle';
  if (phase === 'review' && status === 'completed') return 'completed';
  return 'success';
}

function buildGraphState({
  chatMode,
  steps,
  currentStep,
  selectedStep,
  phase,
  status,
}) {
  const { nodes, edges } = getBlueprint(chatMode);
  const visitedNodeIds = getVisitedNodeIds(steps);
  const selectedNodeId = selectedStep?.nodeKey || currentStep?.nodeKey || null;

  const graphNodes = nodes.map((node) => ({
    id: node.id,
    type: 'agent',
    position: node.position,
    data: {
      label: node.label,
      subtitle: node.subtitle,
      detail: node.detail,
      type: node.type,
      status: getNodeStatus({
        nodeId: node.id,
        steps,
        currentStep,
        phase,
        status,
      }),
      isSelected: selectedNodeId === node.id,
      isCurrent: currentStep?.nodeKey === node.id,
      activityCount: steps.filter((step) => step.nodeKey === node.id).length,
    },
  }));

  const graphEdges = edges.map((edge) => {
    const isTraversed = visitedNodeIds.includes(edge.source)
      && visitedNodeIds.includes(edge.target);
    const isActive = currentStep?.nodeKey === edge.target;
    const isFailed = status === 'failed' && currentStep?.nodeKey === edge.target;
    const stroke = isFailed
      ? '#dc2626'
      : isActive
        ? '#0f172a'
        : isTraversed
          ? '#0f172a'
          : 'rgba(148, 163, 184, 0.28)';

    return {
      ...edge,
      animated: isActive,
      style: {
        stroke,
        strokeWidth: isActive ? 2.4 : isTraversed ? 1.8 : 1.2,
        opacity: isTraversed || isActive ? 1 : 0.6,
      },
    };
  });

  return {
    graphNodes,
    graphEdges,
    focusNodeId: selectedNodeId,
  };
}

function EmptyCanvasState({ chatMode, lastSummary, onOpenLastRun }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.14),_transparent_48%)]" />
      <div className="absolute inset-x-6 top-12 h-px bg-[linear-gradient(90deg,transparent,rgba(15,23,42,0.08),transparent)]" />

      <div className="relative flex flex-1 flex-col justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 24 }}
          className="rounded-[28px] border border-white/70 bg-white/78 p-6 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.45)] backdrop-blur-xl"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-950 text-white">
              <BrainCircuit size={18} strokeWidth={1.7} />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">
                Live orchestration
              </p>
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                Agent execution will appear here
              </h3>
            </div>
          </div>

          <p className="max-w-[34ch] text-sm leading-6 text-slate-600">
            Keep this panel open while you chat. Multi-step reasoning, tool
            calls, and human checkpoints will animate into a live execution map.
          </p>

          <div className="mt-6 grid gap-3">
            {(chatMode === 'model'
              ? ['Prompt intake', 'Model inference', 'Response stream']
              : ['Understand request', 'Plan the route', 'Retrieve evidence'])
              .map((label, index) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-semibold text-slate-500">
                    0
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                </div>
              ))}
          </div>

          {lastSummary && (
            <button
              type="button"
              onClick={onOpenLastRun}
              className="mt-6 w-full rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-left transition-colors hover:border-slate-300 hover:bg-white"
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Last run
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {lastSummary.headline}
                  </p>
                  <p className="text-xs text-slate-500">
                    {lastSummary.stepCount}
                    {' '}
                    steps
                    {' '}
                    ·
                    {' '}
                    {lastSummary.toolNames.length}
                    {' '}
                    tools
                    {' '}
                    ·
                    {' '}
                    {formatDuration(lastSummary.durationMs)}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  {STATUS_LABELS[lastSummary.status]}
                </span>
              </div>
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function ExecutionHeader({
  chatMode,
  status,
  steps,
  followLive,
  onToggleFollow,
  selectedStep,
  summary,
}) {
  return (
    <div className="relative border-b border-slate-200/70 px-4 py-4">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,255,255,0.68))]" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {MODE_LABELS[chatMode]}
            </span>
            <span className={cn(
              'rounded-full border px-2.5 py-1 text-[11px] font-medium',
              STATUS_TONES[status],
            )}
            >
              {STATUS_LABELS[status]}
            </span>
          </div>

          <h3 className="mt-3 text-[15px] font-semibold tracking-tight text-slate-950">
            {selectedStep?.title || summary?.headline || 'Execution stage'}
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {selectedStep?.detail
              || (summary
                ? `${summary.stepCount} steps · ${summary.toolNames.length} tools · ${formatDuration(summary.durationMs)}`
                : 'The orchestration panel mirrors runtime events from the active chat.')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onToggleFollow(!followLive)}
          className={cn(
            'inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-medium transition-all',
            followLive
              ? 'border-slate-950 bg-slate-950 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
          )}
        >
          <Crosshair size={13} strokeWidth={1.8} />
          {followLive ? 'Following live' : 'Follow live'}
        </button>
      </div>

      <div className="relative mt-4 flex items-center gap-2 text-[11px] text-slate-500">
        <span className="font-medium text-slate-900">
          {steps.length}
        </span>
        logged steps
      </div>
    </div>
  );
}

function Timeline({
  steps,
  selectedStepId,
  onSelectStep,
}) {
  return (
    <div className="min-h-0 overflow-y-auto px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
            Execution log
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Click any step to inspect it and sync the linked message.
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {steps.map((step, index) => {
          const StepIcon = TIMELINE_ICONS[step.kind] || Orbit;
          const isActive = selectedStepId === step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelectStep(step.id)}
              className={cn(
                'w-full rounded-2xl border px-3 py-3 text-left transition-all',
                isActive
                  ? 'border-slate-950 bg-slate-950 text-white shadow-[0_18px_44px_-34px_rgba(15,23,42,0.75)]'
                  : 'border-slate-200/80 bg-white/86 text-slate-700 hover:border-slate-300 hover:bg-white',
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border',
                  isActive
                    ? 'border-white/16 bg-white/10 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-600',
                )}
                >
                  <StepIcon size={15} strokeWidth={1.8} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium">
                      {step.title}
                    </p>
                    <span className={cn(
                      'rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em]',
                      isActive
                        ? 'bg-white/12 text-white/80'
                        : 'bg-slate-100 text-slate-500',
                    )}
                    >
                      {step.status}
                    </span>
                  </div>

                  <p className={cn(
                    'mt-1 text-xs leading-5',
                    isActive ? 'text-white/72' : 'text-slate-500',
                  )}
                  >
                    {step.detail}
                  </p>

                  <div className={cn(
                    'mt-2 flex items-center gap-2 text-[11px]',
                    isActive ? 'text-white/60' : 'text-slate-400',
                  )}
                  >
                    <span>
                      0
                      {index + 1}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-current" />
                    <span>{formatClock(step.startedAt)}</span>
                    {step.messageId && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-current" />
                        <span>Linked message</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Inspector({
  step,
  summary,
  phase,
}) {
  const args = formatPayload(step?.args);
  const result = formatPayload(step?.result);

  return (
    <div className="border-t border-slate-200/70 bg-white/80 px-4 py-4">
      {step ? (
        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
                Inspector
              </p>
              <h4 className="mt-2 text-sm font-semibold text-slate-950">
                {step.title}
              </h4>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
              {step.status}
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {step.detail}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
            <span className="rounded-full border border-slate-200 px-2.5 py-1">
              Started
              {' '}
              {formatClock(step.startedAt)}
            </span>
            {step.endedAt && (
              <span className="rounded-full border border-slate-200 px-2.5 py-1">
                Finished
                {' '}
                {formatClock(step.endedAt)}
              </span>
            )}
            {step.toolName && (
              <span className="rounded-full border border-slate-200 px-2.5 py-1">
                {step.toolName}
              </span>
            )}
          </div>

          {(args || result || step.error) && (
            <div className="mt-4 grid gap-3">
              {args && (
                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    Arguments
                  </p>
                  <pre className="max-h-36 overflow-auto rounded-2xl border border-slate-200 bg-slate-950 px-3 py-3 text-[11px] leading-5 text-slate-200">
                    {args}
                  </pre>
                </div>
              )}

              {result && (
                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    Result
                  </p>
                  <pre className="max-h-36 overflow-auto rounded-2xl border border-slate-200 bg-slate-950 px-3 py-3 text-[11px] leading-5 text-slate-200">
                    {result}
                  </pre>
                </div>
              )}

              {step.error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-xs leading-5 text-red-700">
                  {step.error}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
            Summary
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {summary?.headline || 'No execution selected'}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {phase === 'review'
              ? 'Review the completed execution and reopen it later from Last run.'
              : 'Execution details will appear here as soon as the workflow starts.'}
          </p>
        </div>
      )}
    </div>
  );
}

function FlowContent({ graph, fitViewTrigger }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.graphNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.graphEdges);
  const followLive = useWorkflowRuntimeStore((s) => s.followLive);
  const setFollowLive = useWorkflowRuntimeStore((s) => s.setFollowLive);
  const selectStep = useWorkflowRuntimeStore((s) => s.selectStep);
  const steps = useWorkflowRuntimeStore((s) => s.steps);

  const { fitView } = useReactFlow();
  const programmaticMoveRef = useRef(false);

  const fitWholeGraph = useCallback(() => {
    programmaticMoveRef.current = true;
    fitView(FIT_VIEW_OPTS);

    window.setTimeout(() => {
      programmaticMoveRef.current = false;
    }, 320);
  }, [fitView]);

  useEffect(() => {
    setNodes(graph.graphNodes);
    setEdges(graph.graphEdges);
  }, [graph.graphEdges, graph.graphNodes, setEdges, setNodes]);

  useEffect(() => {
    if (fitViewTrigger === 0) return;
    fitWholeGraph();
  }, [fitViewTrigger, fitWholeGraph]);

  useEffect(() => {
    if (!followLive) return;
    fitWholeGraph();
  }, [fitWholeGraph, followLive, graph.graphNodes, graph.graphEdges]);

  const handleNodeClick = useCallback((_, node) => {
    const latestStep = [...steps].reverse().find((step) => step.nodeKey === node.id);
    if (latestStep) selectStep(latestStep.id);
  }, [selectStep, steps]);

  const handleMoveStart = useCallback((_, event) => {
    if (programmaticMoveRef.current || !event) return;
    setFollowLive(false);
  }, [setFollowLive]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onMoveStart={handleMoveStart}
        fitView
        fitViewOptions={FIT_VIEW_OPTS}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant="dots"
          gap={18}
          size={1}
          color="rgba(15,23,42,0.10)"
        />
      </ReactFlow>
    </div>
  );
}

/**
 * @typedef {object} WorkflowCanvasProps
 * @property {string} [className]
 * @property {number} [fitViewTrigger]
 */

export function WorkflowCanvas({ className, fitViewTrigger = 0 }) {
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
  const restoreLastExecution = useWorkflowRuntimeStore((s) => s.restoreLastExecution);

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
    return (
      <div
        className={cn(
          'h-full w-full overflow-hidden rounded-[28px] border border-slate-200/70 bg-[#f4f6fb]',
          className,
        )}
      >
        <EmptyCanvasState
          chatMode={chatMode}
          lastSummary={lastCompletedSummary}
          onOpenLastRun={restoreLastExecution}
        />
      </div>
    );
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
            <FlowContent graph={graph} fitViewTrigger={fitViewTrigger} />
          </ReactFlowProvider>
        </div>

        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
          <Timeline
            steps={steps}
            selectedStepId={selectedStep?.id ?? null}
            onSelectStep={selectStep}
          />
          <Inspector
            step={selectedStep}
            summary={resultSummary || lastCompletedSummary}
            phase={phase}
          />
        </div>
      </div>
    </div>
  );
}
