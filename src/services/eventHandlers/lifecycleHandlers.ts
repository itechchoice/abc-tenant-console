import {
  TaskCompletedPayload,
  TaskFailedPayload,
} from '@/schemas/taskEventSchema';
import { registerHandlers } from './registry';
import type { EventHandler } from './types';

// ---------------------------------------------------------------------------
// TASK_CREATED / INIT
// ---------------------------------------------------------------------------

const handleTaskCreated: EventHandler = (event, ctx) => {
  const { envelope, inner } = event;

  const resolvedTaskId = (envelope.taskId as string)
    ?? (inner.taskId as string | undefined)
    ?? ctx.taskId;

  const newSid = (inner.sessionId as string | undefined)
    ?? (envelope.sessionId as string | undefined);

  if (newSid) {
    ctx.onSessionCreated?.(newSid);
  }

  ctx.runtime.startExecution({
    sessionId: newSid ?? null,
    taskId: resolvedTaskId,
    chatMode: ctx.chatMode,
    status: 'preparing',
  });

  ctx.runtime.recordStep({
    stepId: `${resolvedTaskId || ctx.assistantMessageId}-prepare`,
    stepName: 'INIT',
    title: 'Preparing execution',
    detail: 'Allocating the runtime task and initial context.',
    nodeKey: 'prompt',
    kind: 'phase',
    status: 'running',
    taskId: resolvedTaskId,
    chatMode: ctx.chatMode,
  });
};

// ---------------------------------------------------------------------------
// TASK_COMPLETED / TASK_COMPLETE / COMPLETED / complete
// ---------------------------------------------------------------------------

const handleTaskCompleted: EventHandler = (event, ctx) => {
  const parsed = TaskCompletedPayload.safeParse(event.inner);
  const finalContent = parsed.success
    ? (parsed.data.content ?? parsed.data.text)
    : undefined;

  if (finalContent) {
    ctx.streamedContent = finalContent;
    ctx.needsFlush = true;
  }

  if (ctx.activeWorkflowId) {
    ctx.finishWorkflowExecution(ctx.sessionId, ctx.activeWorkflowId, 'completed');
  }

  ctx.updateMessage(ctx.sessionId, ctx.assistantMessageId, { status: 'completed' });
  ctx.setTyping(ctx.sessionId, false);
  ctx.runtime.finishExecution('completed');
  ctx.onStreamComplete();
};

// ---------------------------------------------------------------------------
// TASK_FAILED
// ---------------------------------------------------------------------------

const handleTaskFailed: EventHandler = (event, ctx) => {
  const parsed = TaskFailedPayload.safeParse(event.inner);
  const errMsg = (parsed.success ? (parsed.data.message ?? parsed.data.error) : undefined)
    ?? (event.envelope.sessionId as string | undefined)
    ?? 'Task execution failed.';

  if (ctx.activeWorkflowId) {
    ctx.finishWorkflowExecution(ctx.sessionId, ctx.activeWorkflowId, 'failed');
  }

  console.error('[SSE] Task failed:', event.envelope);
  ctx.updateMessage(ctx.sessionId, ctx.assistantMessageId, {
    status: 'error',
    content: errMsg,
  });
  ctx.setTyping(ctx.sessionId, false);

  ctx.runtime.recordStep({
    stepId: `${ctx.runtime.taskId || ctx.assistantMessageId}-failed`,
    stepName: 'TASK_FAILED',
    title: 'Execution failed',
    detail: errMsg,
    nodeKey: ctx.runtime.currentNodeKey || 'response',
    kind: 'system',
    status: 'failed',
    messageId: ctx.assistantMessageId,
    error: errMsg,
    chatMode: ctx.chatMode,
  });

  ctx.runtime.finishExecution('failed');
  ctx.onStreamComplete();
};

// ---------------------------------------------------------------------------
// TASK_CANCELLED
// ---------------------------------------------------------------------------

const handleTaskCancelled: EventHandler = (_event, ctx) => {
  ctx.updateMessage(ctx.sessionId, ctx.assistantMessageId, {
    status: 'error',
    content: 'Task was cancelled.',
  });
  ctx.setTyping(ctx.sessionId, false);

  ctx.runtime.recordStep({
    stepId: `${ctx.runtime.taskId || ctx.assistantMessageId}-cancelled`,
    stepName: 'TASK_CANCELLED',
    title: 'Task cancelled',
    detail: 'The task was cancelled.',
    nodeKey: ctx.runtime.currentNodeKey || 'response',
    kind: 'system',
    status: 'failed',
    messageId: ctx.assistantMessageId,
    chatMode: ctx.chatMode,
  });

  ctx.runtime.finishExecution('failed');
  ctx.onStreamComplete();
};

// ---------------------------------------------------------------------------
// TASK_SUSPENDED
// ---------------------------------------------------------------------------

const handleTaskSuspended: EventHandler = (_event, ctx) => {
  ctx.updateMessage(ctx.sessionId, ctx.assistantMessageId, { status: 'pending' });
  ctx.setTyping(ctx.sessionId, false);

  ctx.runtime.recordStep({
    stepId: `${ctx.runtime.taskId || ctx.assistantMessageId}-suspended`,
    stepName: 'TASK_SUSPENDED',
    title: 'Task suspended',
    detail: 'The task is waiting for approval or human input.',
    nodeKey: ctx.runtime.currentNodeKey || 'response',
    kind: 'system',
    status: 'running',
    messageId: ctx.assistantMessageId,
    chatMode: ctx.chatMode,
  });
};

// ---------------------------------------------------------------------------
// error (generic server-side error event)
// ---------------------------------------------------------------------------

const handleError: EventHandler = (event, ctx) => {
  const serverMsg = (event.inner.message as string | undefined)
    ?? (event.envelope.sessionId as string | undefined)
    ?? 'An error occurred while processing your request.';

  console.error('[SSE] Server-side error event:', event.envelope);
  ctx.updateMessage(ctx.sessionId, ctx.assistantMessageId, {
    status: 'error',
    content: serverMsg,
  });
  ctx.setTyping(ctx.sessionId, false);

  ctx.runtime.recordStep({
    stepId: `${ctx.runtime.taskId || ctx.assistantMessageId}-server-error`,
    stepName: 'ERROR',
    title: 'Server error',
    detail: serverMsg,
    nodeKey: ctx.runtime.currentNodeKey || 'response',
    kind: 'system',
    status: 'failed',
    messageId: ctx.assistantMessageId,
    error: serverMsg,
    chatMode: ctx.chatMode,
  });

  ctx.runtime.finishExecution('failed');
  ctx.onStreamComplete();
};

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

registerHandlers({
  TASK_CREATED: handleTaskCreated,
  INIT: handleTaskCreated,
  TASK_COMPLETED: handleTaskCompleted,
  TASK_COMPLETE: handleTaskCompleted,
  COMPLETED: handleTaskCompleted,
  complete: handleTaskCompleted,
  TASK_FAILED: handleTaskFailed,
  TASK_CANCELLED: handleTaskCancelled,
  TASK_SUSPENDED: handleTaskSuspended,
  error: handleError,
});
