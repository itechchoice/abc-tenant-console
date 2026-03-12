import {
  TokenStreamPayload,
  ToolCallPayload,
  ToolResultPayload,
  ClientInteractionPayload,
} from '@/schemas/taskEventSchema';
import { registerHandlers } from './registry';
import type { EventHandler, StreamContext } from './types';

// ---------------------------------------------------------------------------
// TOKEN_STREAM / TEXT_CHUNK / LLM_CHUNK / message_chunk
// ---------------------------------------------------------------------------

const handleTokenStream: EventHandler = (event, ctx) => {
  const parsed = TokenStreamPayload.safeParse(event.inner);
  if (!parsed.success) return;

  const text = parsed.data.content ?? parsed.data.text ?? '';
  if (!text) return;

  ensureResponseStep(ctx);
  ctx.streamedContent += text;
  ctx.needsFlush = true;
};

// ---------------------------------------------------------------------------
// TOOL_CALL / tool_call
// ---------------------------------------------------------------------------

const handleToolCall: EventHandler = (event, ctx) => {
  const parsed = ToolCallPayload.safeParse(event.inner);
  if (!parsed.success) return;

  const toolId = parsed.data.id || crypto.randomUUID();
  const toolName = parsed.data.toolName ?? parsed.data.name ?? '';

  ctx.runtime.recordToolCall({
    messageId: toolId,
    toolName,
    args: parsed.data.toolArgs ?? parsed.data.args,
    taskId: ctx.taskId,
    chatMode: ctx.chatMode,
  });

  ctx.addMessage(ctx.sessionId, {
    id: toolId,
    role: 'tool',
    content: '',
    timestamp: Date.now(),
    status: 'pending',
    toolCalls: [{
      id: toolId,
      name: toolName,
      args: parsed.data.toolArgs ?? parsed.data.args,
      status: 'running',
    }],
    metadata: { type: 'tool_call' },
  });
};

// ---------------------------------------------------------------------------
// TOOL_RESULT
// ---------------------------------------------------------------------------

const handleToolResult: EventHandler = (event, ctx) => {
  const parsed = ToolResultPayload.safeParse(event.inner);
  if (!parsed.success) return;

  const toolId = parsed.data.id;
  if (!toolId) return;

  const existing = ctx.getMessage(ctx.sessionId, toolId);
  if (!existing) return;

  ctx.updateMessage(ctx.sessionId, toolId, {
    status: 'completed',
    toolCalls: existing.toolCalls?.map((tc) =>
      tc.id === toolId
        ? { ...tc, result: parsed.data.result, status: 'completed' as const }
        : tc,
    ),
  });
};

// ---------------------------------------------------------------------------
// client_interaction
// ---------------------------------------------------------------------------

const handleClientInteraction: EventHandler = (event, ctx) => {
  const parsed = ClientInteractionPayload.safeParse(event.inner);
  if (!parsed.success) return;

  const widgets = parsed.data.widgets ?? [];
  const interactionId = parsed.data.interactionId;

  ctx.setTyping(ctx.sessionId, false);
  ctx.addMessage(ctx.sessionId, {
    id: interactionId || crypto.randomUUID(),
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    status: 'completed',
    metadata: { type: 'interaction', widgets },
  });

  ctx.runtime.markAwaitingInteraction({
    interactionId: interactionId ?? null,
    messageId: interactionId ?? null,
    widgetCount: widgets.length,
    chatMode: ctx.chatMode,
  });
};

// ---------------------------------------------------------------------------
// Shared helper — ensure a "response" step is running in the runtime
// ---------------------------------------------------------------------------

function ensureResponseStep(ctx: StreamContext) {
  if (ctx.runtime.phase === 'idle') return;

  const current = ctx.runtime.steps.find((s) => s.id === ctx.runtime.currentStepId);
  if (current?.nodeKey === 'response' && current.status === 'running') return;

  ctx.runtime.recordStep({
    stepId: `${ctx.assistantMessageId}-response`,
    stepName: 'MODEL_RESPONSE',
    title: 'Streaming response',
    detail: 'The model is generating a direct answer.',
    nodeKey: 'response',
    kind: 'phase',
    status: 'running',
    messageId: ctx.assistantMessageId,
    chatMode: ctx.chatMode,
  });
}

// ---------------------------------------------------------------------------
// Register all message-related handlers
// ---------------------------------------------------------------------------

registerHandlers({
  TOKEN_STREAM: handleTokenStream,
  TEXT_CHUNK: handleTokenStream,
  LLM_CHUNK: handleTokenStream,
  message_chunk: handleTokenStream,
  TOOL_CALL: handleToolCall,
  tool_call: handleToolCall,
  TOOL_RESULT: handleToolResult,
  client_interaction: handleClientInteraction,
});
