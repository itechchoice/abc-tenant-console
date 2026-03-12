import { StepStartPayload, StepDonePayload } from '@/schemas/taskEventSchema';
import { registerHandlers } from './registry';
import type { EventHandler } from './types';

// ---------------------------------------------------------------------------
// STEP_START
// ---------------------------------------------------------------------------

const handleStepStart: EventHandler = (event, ctx) => {
  const parsed = StepStartPayload.safeParse(event.inner);
  if (!parsed.success) return;

  const { type, workflowId, nodeId, nodeType } = parsed.data;

  if (type === 'WORKFLOW' && workflowId) {
    ctx.activeWorkflowId = workflowId;
    ctx.startWorkflowExecution(ctx.sessionId, workflowId);

    const existingMsg = ctx.getMessage(ctx.sessionId, ctx.assistantMessageId);
    ctx.updateMessage(ctx.sessionId, ctx.assistantMessageId, {
      metadata: { ...existingMsg?.metadata, workflowId },
    });

    ctx.appendStepEvent(ctx.sessionId, workflowId, {
      id: event.envelope.eventId,
      eventType: 'STEP_START',
      timestamp: event.envelope.timestamp ?? new Date().toISOString(),
      streamedContent: '',
      payload: event.inner,
    });
    return;
  }

  if (nodeId && ctx.activeWorkflowId) {
    ctx.updateNodeState(ctx.sessionId, ctx.activeWorkflowId, nodeId, {
      status: 'running',
      nodeType,
      startTimestamp: event.envelope.timestamp,
    });
    ctx.appendStepEvent(ctx.sessionId, ctx.activeWorkflowId, {
      id: event.envelope.eventId,
      eventType: 'STEP_START',
      timestamp: event.envelope.timestamp ?? new Date().toISOString(),
      nodeId,
      nodeType,
      status: 'running',
      streamedContent: '',
      payload: event.inner,
    });
  }

  const stepName = type ?? parsed.data.stepName ?? null;
  ctx.runtime.recordStep({
    stepName,
    taskId: ctx.taskId ?? ctx.runtime.taskId,
    chatMode: ctx.chatMode,
  });
};

// ---------------------------------------------------------------------------
// STEP_DONE / STEP_COMPLETE
// ---------------------------------------------------------------------------

const handleStepDone: EventHandler = (event, ctx) => {
  const parsed = StepDonePayload.safeParse(event.inner);
  if (!parsed.success) return;

  const { nodeId, status, nodeType, reason } = parsed.data;

  if (nodeId && ctx.activeWorkflowId) {
    const nodeStatus = status || 'completed';
    ctx.updateNodeState(ctx.sessionId, ctx.activeWorkflowId, nodeId, {
      status: nodeStatus,
      nodeType,
      reason,
      endTimestamp: event.envelope.timestamp,
      payload: event.inner as Record<string, unknown>,
    });
    ctx.appendStepEvent(ctx.sessionId, ctx.activeWorkflowId, {
      id: event.envelope.eventId,
      eventType: 'STEP_DONE',
      timestamp: event.envelope.timestamp ?? new Date().toISOString(),
      nodeId,
      nodeType,
      status: nodeStatus,
      streamedContent: '',
      payload: event.inner as Record<string, unknown>,
      reason,
    });
  }

  ctx.runtime.recordStep({
    stepId: parsed.data.stepId,
    stepName: parsed.data.stepName,
    taskId: ctx.taskId ?? ctx.runtime.taskId,
    chatMode: ctx.chatMode,
    status: 'completed',
  });
};

// ---------------------------------------------------------------------------
// COMPILE_START
// ---------------------------------------------------------------------------

const handleCompileStart: EventHandler = (_event, ctx) => {
  ctx.runtime.recordStep({
    stepId: `${ctx.taskId ?? ctx.runtime.taskId}-compile`,
    stepName: 'COMPILE',
    title: 'Compiling workflow',
    detail: 'The agent is compiling the execution plan.',
    nodeKey: 'model',
    kind: 'phase',
    status: 'running',
    taskId: ctx.taskId ?? ctx.runtime.taskId,
    chatMode: ctx.chatMode,
  });
};

// ---------------------------------------------------------------------------
// COMPILE_DONE
// ---------------------------------------------------------------------------

const handleCompileDone: EventHandler = (_event, ctx) => {
  ctx.runtime.recordStep({
    stepId: `${ctx.taskId ?? ctx.runtime.taskId}-compile`,
    stepName: 'COMPILE',
    status: 'completed',
    taskId: ctx.taskId ?? ctx.runtime.taskId,
    chatMode: ctx.chatMode,
  });
};

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

registerHandlers({
  STEP_START: handleStepStart,
  STEP_DONE: handleStepDone,
  STEP_COMPLETE: handleStepDone,
  COMPILE_START: handleCompileStart,
  COMPILE_DONE: handleCompileDone,
});
