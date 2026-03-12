import { WorkflowNodePayload } from '@/schemas/taskEventSchema';
import { registerHandlers } from './registry';
import type { EventHandler } from './types';

// ---------------------------------------------------------------------------
// workflow_pending / node_pending
// ---------------------------------------------------------------------------

const handleWorkflowPending: EventHandler = (event, ctx) => {
  const parsed = WorkflowNodePayload.safeParse(event.inner);
  if (!parsed.success) return;

  if (parsed.data.workflowId) {
    ctx.activeWorkflowId = parsed.data.workflowId;
  }

  ctx.runtime.syncExecutionContext({
    workflowId: parsed.data.workflowId ?? null,
  });
};

// ---------------------------------------------------------------------------
// node_complete
// ---------------------------------------------------------------------------

const handleNodeComplete: EventHandler = (event, ctx) => {
  const parsed = WorkflowNodePayload.safeParse(event.inner);
  if (!parsed.success) return;

  ctx.runtime.syncExecutionContext({
    workflowId: parsed.data.workflowId ?? null,
  });
};

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

registerHandlers({
  workflow_pending: handleWorkflowPending,
  node_pending: handleWorkflowPending,
  node_complete: handleNodeComplete,
});
