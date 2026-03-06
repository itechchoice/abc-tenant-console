import { create } from 'zustand';
import {
  WorkflowExecutionSummarySchema,
  WorkflowRuntimeStepSchema,
} from '@/schemas/workflowRuntimeSchema';

/**
 * @typedef {import('@/schemas/chatSchema').Message} Message
 * @typedef {import('@/schemas/workflowRuntimeSchema')
 *   .WorkflowExecutionSummary} WorkflowExecutionSummary
 * @typedef {import('@/schemas/workflowRuntimeSchema')
 *   .WorkflowExecutionStatus} WorkflowExecutionStatus
 * @typedef {import('@/schemas/workflowRuntimeSchema').WorkflowNodeKey} WorkflowNodeKey
 * @typedef {import('@/schemas/workflowRuntimeSchema').WorkflowPanelPhase} WorkflowPanelPhase
 * @typedef {import('@/schemas/workflowRuntimeSchema').WorkflowRuntimeStep} WorkflowRuntimeStep
 */

let reviewTimer = null;

function clearReviewTimer() {
  if (reviewTimer) {
    clearTimeout(reviewTimer);
    reviewTimer = null;
  }
}

function toTitleCase(value = '') {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * @param {string | null | undefined} stepName
 * @param {'auto' | 'agent' | 'model'} [chatMode='auto']
 * @returns {WorkflowNodeKey}
 */
export function inferNodeKeyFromStepName(stepName, chatMode = 'auto') {
  const normalized = String(stepName || '').toUpperCase();

  if (chatMode === 'model') {
    if (normalized.includes('RESPONSE') || normalized.includes('CHAT')) return 'response';
    return 'model';
  }

  if (!normalized) return 'plan';
  if (normalized.includes('ASK') || normalized.includes('INTERACTION')) return 'ask-user';
  if (normalized.includes('TOOL') || normalized.includes('SEARCH') || normalized.includes('RAG')
    || normalized.includes('RETRIEVE')) return 'retrieve';
  if (normalized.includes('DIRECT') || normalized.includes('FINAL')
    || normalized.includes('RESPONSE')) return 'respond';
  if (normalized.includes('ROUTE') || normalized.includes('INTENT')
    || normalized.includes('UNDERSTAND')) return 'understand';
  if (normalized.includes('PLAN') || normalized.includes('INIT')) return 'plan';
  if (normalized.includes('LLM') || normalized.includes('DECIDE')
    || normalized.includes('REASON') || normalized.includes('ANALYZE')) return 'decide';

  return 'decide';
}

function createStepId(prefix = 'step') {
  return `${prefix}-${crypto.randomUUID()}`;
}

/**
 * @param {string | null | undefined} stepName
 * @param {'auto' | 'agent' | 'model'} [chatMode='auto']
 */
function createStepTitle(stepName, chatMode = 'auto') {
  if (!stepName && chatMode === 'model') return 'Running model';
  if (!stepName) return 'Running workflow';

  const normalized = String(stepName).toUpperCase();

  if (normalized === 'DIRECT_CHAT') return 'Drafting response';
  if (normalized.includes('TOOL')) return 'Running tool';
  if (normalized.includes('INTERACTION')) return 'Waiting for input';
  if (normalized.includes('INIT')) return 'Preparing execution';

  return toTitleCase(stepName);
}

/**
 * @param {WorkflowNodeKey} nodeKey
 * @param {'auto' | 'agent' | 'model'} [chatMode='auto']
 */
function defaultStepDetail(nodeKey, chatMode = 'auto') {
  if (chatMode === 'model') {
    if (nodeKey === 'prompt') return 'Preparing the prompt payload.';
    if (nodeKey === 'response') return 'Streaming the final response.';
    return 'Generating a direct model answer.';
  }

  switch (nodeKey) {
    case 'understand':
      return 'Parsing the user request and its constraints.';
    case 'plan':
      return 'Planning the execution path.';
    case 'retrieve':
      return 'Calling tools and collecting evidence.';
    case 'decide':
      return 'Synthesizing evidence into a decision.';
    case 'ask-user':
      return 'Waiting for a user-side confirmation or missing input.';
    case 'respond':
      return 'Composing the final answer.';
    default:
      return 'Updating the orchestration state.';
  }
}

function getEntryNode(chatMode = 'auto') {
  return chatMode === 'model' ? 'prompt' : 'understand';
}

function getResponseNode(chatMode = 'auto') {
  return chatMode === 'model' ? 'response' : 'respond';
}

/**
 * @param {WorkflowRuntimeStep[]} steps
 * @param {WorkflowExecutionStatus} status
 * @param {'auto' | 'agent' | 'model'} chatMode
 * @returns {WorkflowExecutionSummary | null}
 */
function buildSummary(steps, status, chatMode) {
  if (!steps.length) return null;

  const firstStartedAt = steps[0]?.startedAt ?? Date.now();
  const completedAt = Date.now();
  const toolNames = [...new Set(
    steps
      .filter((step) => step.kind === 'tool' && step.toolName)
      .map((step) => step.toolName),
  )];

  let finalState = 'workflow';
  if (status === 'failed') {
    finalState = 'failed';
  } else if (steps.some((step) => step.status === 'waiting')) {
    finalState = 'interaction_required';
  } else if (chatMode !== 'agent' && toolNames.length === 0) {
    finalState = 'direct';
  }

  const headlineMap = {
    direct: 'Direct response completed',
    workflow: 'Workflow execution completed',
    interaction_required: 'Workflow is waiting for user input',
    failed: 'Workflow execution failed',
  };

  const candidate = {
    finalState,
    status,
    stepCount: steps.length,
    toolNames,
    completedAt,
    durationMs: Math.max(0, completedAt - firstStartedAt),
    headline: headlineMap[finalState],
  };

  const validation = WorkflowExecutionSummarySchema.safeParse(candidate);
  return validation.success ? validation.data : null;
}

/**
 * @typedef {object} WorkflowRuntimeState
 * @property {string | null} executionSessionId
 * @property {string | null} taskId
 * @property {string | null} workflowId
 * @property {WorkflowPanelPhase} phase
 * @property {WorkflowExecutionStatus} status
 * @property {'auto' | 'agent' | 'model'} chatMode
 * @property {WorkflowRuntimeStep[]} steps
 * @property {string | null} currentStepId
 * @property {WorkflowNodeKey | null} currentNodeKey
 * @property {boolean} awaitingInteraction
 * @property {boolean} followLive
 * @property {string | null} selectedStepId
 * @property {string | null} selectedMessageId
 * @property {WorkflowExecutionSummary | null} resultSummary
 * @property {WorkflowExecutionSummary | null} lastCompletedSummary
 * @property {{
 *   steps: WorkflowRuntimeStep[],
 *   chatMode: 'auto' | 'agent' | 'model',
 *   status: WorkflowExecutionStatus,
 *   summary: WorkflowExecutionSummary | null,
 *   currentStepId: string | null,
 *   selectedStepId: string | null,
 * } | null} lastExecutionSnapshot
 */

/**
 * @typedef {object} WorkflowRuntimeActions
 * @property {(payload?: {
 *   sessionId?: string | null,
 *   taskId?: string | null,
 *   workflowId?: string | null,
 *   chatMode?: 'auto' | 'agent' | 'model',
 *   status?: WorkflowExecutionStatus,
 *   nodeKey?: WorkflowNodeKey | null,
 * }) => void} startExecution
 * @property {(payload: {
 *   sessionId?: string | null,
 *   taskId?: string | null,
 *   workflowId?: string | null,
 * }) => void} syncExecutionContext
 * @property {(payload?: {
 *   stepId?: string,
 *   stepName?: string | null,
 *   title?: string,
 *   detail?: string,
 *   nodeKey?: WorkflowNodeKey,
 *   kind?: WorkflowRuntimeStep['kind'],
 *   status?: WorkflowRuntimeStep['status'],
 *   messageId?: string | null,
 *   taskId?: string | null,
 *   toolName?: string | null,
 *   args?: unknown,
 *   result?: unknown,
 *   error?: string | null,
 *   chatMode?: 'auto' | 'agent' | 'model',
 * }) => string | null} recordStep
 * @property {(payload: {
 *   messageId: string,
 *   toolName?: string | null,
 *   args?: unknown,
 *   taskId?: string | null,
 *   chatMode?: 'auto' | 'agent' | 'model',
 * }) => string | null} recordToolCall
 * @property {(payload: {
 *   interactionId?: string | null,
 *   messageId?: string | null,
 *   widgetCount?: number,
 *   chatMode?: 'auto' | 'agent' | 'model',
 * }) => string | null} markAwaitingInteraction
 * @property {(status: Extract<WorkflowExecutionStatus, 'completed' | 'failed'>)
 *   => void} finishExecution
 * @property {(stepId: string | null) => void} selectStep
 * @property {(messageId: string) => void} selectStepByMessageId
 * @property {(flag: boolean) => void} setFollowLive
 * @property {() => void} restoreLastExecution
 * @property {() => void} resetRuntime
 */

/** @type {WorkflowRuntimeState} */
const INITIAL_STATE = {
  executionSessionId: null,
  taskId: null,
  workflowId: null,
  phase: 'idle',
  status: 'idle',
  chatMode: 'auto',
  steps: [],
  currentStepId: null,
  currentNodeKey: null,
  awaitingInteraction: false,
  followLive: true,
  selectedStepId: null,
  selectedMessageId: null,
  resultSummary: null,
  lastCompletedSummary: null,
  lastExecutionSnapshot: null,
};

/**
 * @type {import('zustand').UseBoundStore<
 *   import('zustand').StoreApi<WorkflowRuntimeState & WorkflowRuntimeActions>
 * >}
 */
export const useWorkflowRuntimeStore = create((set, get) => ({
  ...INITIAL_STATE,

  startExecution: (payload = {}) => {
    clearReviewTimer();

    set((state) => ({
      executionSessionId: payload.sessionId
        ?? payload.taskId
        ?? state.executionSessionId
        ?? createStepId('run'),
      taskId: payload.taskId ?? state.taskId,
      workflowId: payload.workflowId ?? state.workflowId,
      phase: 'live',
      status: payload.status ?? (state.phase === 'live' ? state.status : 'preparing'),
      chatMode: payload.chatMode ?? state.chatMode,
      currentNodeKey: payload.nodeKey ?? state.currentNodeKey ?? getEntryNode(payload.chatMode),
      currentStepId: state.phase === 'live' ? state.currentStepId : null,
      steps: state.phase === 'live' ? state.steps : [],
      awaitingInteraction: false,
      followLive: state.phase === 'live' ? state.followLive : true,
      selectedStepId: state.phase === 'live' ? state.selectedStepId : null,
      selectedMessageId: state.phase === 'live' ? state.selectedMessageId : null,
      resultSummary: null,
    }));
  },

  syncExecutionContext: (payload) => {
    set((state) => ({
      executionSessionId: payload.sessionId ?? state.executionSessionId,
      taskId: payload.taskId ?? state.taskId,
      workflowId: payload.workflowId ?? state.workflowId,
    }));
  },

  recordStep: (payload = {}) => {
    const state = get();
    const chatMode = payload.chatMode ?? state.chatMode;
    const nodeKey = payload.nodeKey ?? inferNodeKeyFromStepName(payload.stepName, chatMode);
    const now = Date.now();

    const candidate = {
      id: payload.stepId ?? createStepId(nodeKey),
      kind: payload.kind ?? 'phase',
      title: payload.title ?? createStepTitle(payload.stepName, chatMode),
      detail: payload.detail ?? defaultStepDetail(nodeKey, chatMode),
      nodeKey,
      status: payload.status ?? 'running',
      startedAt: now,
      endedAt: null,
      messageId: payload.messageId ?? null,
      taskId: payload.taskId ?? state.taskId ?? null,
      toolName: payload.toolName ?? null,
      args: payload.args,
      result: payload.result,
      error: payload.error ?? null,
    };

    const validation = WorkflowRuntimeStepSchema.safeParse(candidate);
    if (!validation.success) return null;

    const nextStep = validation.data;

    set((current) => {
      const previousRunningStepId = current.currentStepId;
      const steps = current.steps.map((step) => {
        if (step.id === previousRunningStepId
          && step.id !== nextStep.id
          && (step.status === 'running' || step.status === 'pending')) {
          return {
            ...step,
            status: 'completed',
            endedAt: now,
          };
        }
        return step;
      });

      const existingIndex = steps.findIndex((step) => step.id === nextStep.id);
      const mergedSteps = existingIndex >= 0
        ? steps.map((step, index) => (index === existingIndex ? {
          ...step,
          ...nextStep,
          startedAt: step.startedAt,
        } : step))
        : [...steps, nextStep];

      return {
        phase: 'live',
        status: nextStep.status === 'waiting' ? 'waiting' : 'running',
        chatMode,
        steps: mergedSteps,
        currentStepId: nextStep.id,
        currentNodeKey: nextStep.nodeKey,
        awaitingInteraction: nextStep.status === 'waiting',
        selectedStepId: current.followLive ? nextStep.id : current.selectedStepId,
        selectedMessageId: current.followLive
          ? (nextStep.messageId ?? current.selectedMessageId)
          : current.selectedMessageId,
      };
    });

    return nextStep.id;
  },

  recordToolCall: (payload) => {
    const state = get();
    const chatMode = payload.chatMode ?? state.chatMode;
    const nodeKey = state.currentNodeKey === 'ask-user'
      ? 'decide'
      : (state.currentNodeKey || inferNodeKeyFromStepName('TOOL_CALL', chatMode));

    return get().recordStep({
      stepId: `${payload.messageId}-tool`,
      kind: 'tool',
      title: payload.toolName ? `Tool: ${payload.toolName}` : 'Tool invocation',
      detail: payload.toolName
        ? `Calling ${payload.toolName} for external evidence.`
        : 'Calling an external tool.',
      nodeKey,
      status: 'running',
      messageId: payload.messageId,
      taskId: payload.taskId ?? state.taskId,
      toolName: payload.toolName ?? null,
      args: payload.args,
      chatMode,
    });
  },

  markAwaitingInteraction: (payload) => get().recordStep({
    stepId: payload.interactionId ?? createStepId('interaction'),
    kind: 'interaction',
    title: 'Waiting for user input',
    detail: payload.widgetCount
      ? `Review ${payload.widgetCount} requested field(s) to continue.`
      : 'The workflow needs an extra confirmation before it can continue.',
    nodeKey: 'ask-user',
    status: 'waiting',
    messageId: payload.messageId ?? payload.interactionId ?? null,
    chatMode: payload.chatMode,
  }),

  finishExecution: (status) => {
    clearReviewTimer();

    set((state) => {
      const now = Date.now();
      const steps = state.steps.map((step) => {
        if (step.status === 'running' || step.status === 'pending') {
          return { ...step, status: 'completed', endedAt: now };
        }
        if (status === 'failed' && step.status === 'waiting') {
          return { ...step, status: 'failed', endedAt: now };
        }
        return step;
      });

      const summary = buildSummary(steps, status, state.chatMode);
      const currentSelectedId = state.followLive
        ? (steps[steps.length - 1]?.id ?? state.selectedStepId)
        : state.selectedStepId;
      const currentSelectedStep = steps.find((step) => step.id === currentSelectedId);

      return {
        phase: 'review',
        status,
        steps,
        awaitingInteraction: false,
        currentStepId: steps[steps.length - 1]?.id ?? state.currentStepId,
        currentNodeKey: steps[steps.length - 1]?.nodeKey
          ?? getResponseNode(state.chatMode),
        selectedStepId: currentSelectedId,
        selectedMessageId: currentSelectedStep?.messageId ?? state.selectedMessageId,
        resultSummary: summary,
        lastCompletedSummary: summary ?? state.lastCompletedSummary,
        lastExecutionSnapshot: {
          steps,
          chatMode: state.chatMode,
          status,
          summary,
          currentStepId: steps[steps.length - 1]?.id ?? state.currentStepId,
          selectedStepId: currentSelectedId,
        },
      };
    });
  },

  selectStep: (stepId) => {
    const step = get().steps.find((item) => item.id === stepId);
    set({
      selectedStepId: stepId,
      selectedMessageId: step?.messageId ?? null,
      followLive: false,
    });
  },

  selectStepByMessageId: (messageId) => {
    const step = [...get().steps].reverse().find((item) => item.messageId === messageId);
    if (!step) return;
    set({
      selectedStepId: step.id,
      selectedMessageId: messageId,
      followLive: false,
    });
  },

  setFollowLive: (flag) => {
    if (!flag) {
      set({ followLive: false });
      return;
    }

    const { currentStepId, steps } = get();
    const currentStep = steps.find((step) => step.id === currentStepId);
    set({
      followLive: true,
      selectedStepId: currentStep?.id ?? null,
      selectedMessageId: currentStep?.messageId ?? null,
    });
  },

  restoreLastExecution: () => {
    const snapshot = get().lastExecutionSnapshot;
    if (!snapshot?.steps?.length) return;

    const selectedStepId = snapshot.selectedStepId ?? snapshot.currentStepId;
    const selectedStep = snapshot.steps.find((step) => step.id === selectedStepId)
      ?? snapshot.steps[snapshot.steps.length - 1];

    set((state) => ({
      phase: 'review',
      status: snapshot.status,
      chatMode: snapshot.chatMode,
      steps: snapshot.steps,
      currentStepId: snapshot.currentStepId,
      currentNodeKey: selectedStep?.nodeKey
        ?? snapshot.steps[snapshot.steps.length - 1]?.nodeKey
        ?? null,
      awaitingInteraction: snapshot.status === 'waiting',
      selectedStepId: selectedStep?.id ?? null,
      selectedMessageId: selectedStep?.messageId ?? null,
      resultSummary: snapshot.summary,
      lastCompletedSummary: snapshot.summary ?? state.lastCompletedSummary,
      followLive: false,
    }));
  },

  resetRuntime: () => {
    clearReviewTimer();
    set((state) => ({
      ...INITIAL_STATE,
      lastCompletedSummary: state.resultSummary ?? state.lastCompletedSummary,
      lastExecutionSnapshot: state.lastExecutionSnapshot,
      chatMode: state.chatMode,
    }));
  },
}));
