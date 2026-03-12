import { z } from 'zod';

// ---------------------------------------------------------------------------
// SSE envelope — the outer structure of every `data:` payload
// ---------------------------------------------------------------------------

export const SseEnvelopeSchema = z.object({
  taskId: z.string(),
  eventId: z.string(),
  type: z.string(),
  payload: z.string().nullable(),
  timestamp: z.string().optional(),
  sessionId: z.string().optional(),
});
export type SseEnvelope = z.infer<typeof SseEnvelopeSchema>;

// ---------------------------------------------------------------------------
// Event-specific inner payloads
// ---------------------------------------------------------------------------

export const TokenStreamPayload = z.object({
  content: z.string().optional(),
  text: z.string().optional(),
});
export type TokenStreamData = z.infer<typeof TokenStreamPayload>;

export const StepStartPayload = z.object({
  type: z.string().optional(),
  stepName: z.string().optional(),
  modelId: z.string().optional(),
  workflowId: z.string().optional(),
  nodeId: z.string().optional(),
  nodeType: z.string().optional(),
});

export const StepDonePayload = z.object({
  stepId: z.string().optional(),
  stepName: z.string().optional(),
  nodeId: z.string().optional(),
  nodeType: z.string().optional(),
  status: z.string().optional(),
  reason: z.string().optional(),
});

export const ToolCallPayload = z.object({
  id: z.string().optional(),
  toolName: z.string().optional(),
  name: z.string().optional(),
  toolArgs: z.record(z.string(), z.unknown()).optional(),
  args: z.record(z.string(), z.unknown()).optional(),
});

export const ToolResultPayload = z.object({
  id: z.string().optional(),
  toolName: z.string().optional(),
  name: z.string().optional(),
  result: z.unknown().optional(),
});

export const TaskFailedPayload = z.object({
  message: z.string().optional(),
  error: z.string().optional(),
});

export const TaskCompletedPayload = z.object({
  content: z.string().optional(),
  text: z.string().optional(),
});

export const ClientInteractionPayload = z.object({
  interactionId: z.string().optional(),
  widgets: z.array(z.unknown()).optional(),
});

export const WorkflowNodePayload = z.object({
  workflowId: z.string().optional(),
  nodeId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Event type constants
// ---------------------------------------------------------------------------

export const TaskEventType = {
  TASK_CREATED: 'TASK_CREATED',
  INIT: 'INIT',
  COMPILE_START: 'COMPILE_START',
  COMPILE_DONE: 'COMPILE_DONE',
  STEP_START: 'STEP_START',
  STEP_DONE: 'STEP_DONE',
  STEP_COMPLETE: 'STEP_COMPLETE',
  TOKEN_STREAM: 'TOKEN_STREAM',
  TEXT_CHUNK: 'TEXT_CHUNK',
  LLM_CHUNK: 'LLM_CHUNK',
  TOOL_CALL: 'TOOL_CALL',
  TOOL_RESULT: 'TOOL_RESULT',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_COMPLETE: 'TASK_COMPLETE',
  COMPLETED: 'COMPLETED',
  TASK_FAILED: 'TASK_FAILED',
  TASK_CANCELLED: 'TASK_CANCELLED',
  TASK_SUSPENDED: 'TASK_SUSPENDED',
  message_chunk: 'message_chunk',
  tool_call: 'tool_call',
  workflow_pending: 'workflow_pending',
  node_pending: 'node_pending',
  node_complete: 'node_complete',
  client_interaction: 'client_interaction',
  complete: 'complete',
  error: 'error',
} as const;

export const TOKEN_EVENT_TYPES: ReadonlySet<string> = new Set([
  TaskEventType.TOKEN_STREAM,
  TaskEventType.TEXT_CHUNK,
  TaskEventType.LLM_CHUNK,
  TaskEventType.message_chunk,
]);

export const TERMINAL_EVENT_TYPES: ReadonlySet<string> = new Set([
  TaskEventType.TASK_COMPLETED,
  TaskEventType.TASK_COMPLETE,
  TaskEventType.COMPLETED,
  TaskEventType.TASK_FAILED,
  TaskEventType.TASK_CANCELLED,
  TaskEventType.complete,
  TaskEventType.error,
]);

// ---------------------------------------------------------------------------
// Unified parse entry — the ONLY place JSON.parse runs for SSE data
// ---------------------------------------------------------------------------

export interface ParsedTaskEvent {
  envelope: SseEnvelope;
  type: string;
  inner: Record<string, unknown>;
}

export function parseTaskEvent(rawData: string): ParsedTaskEvent | null {
  try {
    const raw: unknown = JSON.parse(rawData);
    const result = SseEnvelopeSchema.safeParse(raw);
    if (!result.success) {
      console.warn('[SSE] Envelope validation failed:', result.error);
      return null;
    }
    const envelope = result.data;
    let inner: Record<string, unknown> = {};
    if (envelope.payload) {
      try {
        inner = JSON.parse(envelope.payload) as Record<string, unknown>;
      } catch { /* non-JSON payload — acceptable */ }
    }
    return { envelope, type: envelope.type, inner };
  } catch {
    console.warn('[SSE] Failed to parse event data:', rawData);
    return null;
  }
}
