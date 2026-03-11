import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enum Schemas
// ---------------------------------------------------------------------------

/**
 * Canonical set of message author roles within a conversation turn.
 *
 * - `user`      – human operator input.
 * - `assistant` – LLM-generated response.
 * - `system`    – system-level prompt injected by the orchestration layer.
 * - `tool`      – result payload returned by a tool invocation.
 */
export const MessageRoleSchema = z.enum([
  'user',
  'assistant',
  'system',
  'tool',
]);

/**
 * Lifecycle status of a single message within the streaming pipeline.
 *
 * - `pending`   – submitted but not yet acknowledged by the backend.
 * - `streaming` – assistant is actively appending tokens via SSE.
 * - `completed` – final content has been received and committed.
 * - `error`     – an unrecoverable error terminated this message.
 */
export const MessageStatusSchema = z.enum([
  'pending',
  'streaming',
  'completed',
  'error',
]);

/**
 * Execution status of an individual tool call.
 *
 * - `pending`   – call has been issued but not yet picked up.
 * - `running`   – tool is actively executing.
 * - `completed` – execution finished successfully.
 * - `error`     – execution failed.
 */
export const ToolCallStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'error',
]);

// ---------------------------------------------------------------------------
// Object Schemas
// ---------------------------------------------------------------------------

/**
 * Represents a single tool / function-call invocation attached to an
 * assistant message.  The LLM emits these when it decides to delegate
 * work to an external capability (web search, code interpreter, etc.).
 */
export const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  args: z.record(z.string(), z.any()).optional(),
  result: z.any().optional(),
  status: ToolCallStatusSchema.optional(),
});

/**
 * Core message schema – the **single source of truth** for every message
 * that flows through the chat pipeline.
 *
 * All external data (SSE payloads, persisted conversations loaded from the
 * server) **must** pass through `MessageSchema.parse()` before entering
 * the Zustand store or being rendered by React components.
 */
export const MessageSchema = z.object({
  id: z.string(),
  role: MessageRoleSchema,
  content: z.string(),
  timestamp: z.number(),
  status: MessageStatusSchema,
  toolCalls: z.array(ToolCallSchema).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  taskId: z.string().optional(),
  taskStatus: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Derived TypeScript types
// ---------------------------------------------------------------------------

export type MessageRole = z.infer<typeof MessageRoleSchema>;
export type MessageStatus = z.infer<typeof MessageStatusSchema>;
export type ToolCallStatus = z.infer<typeof ToolCallStatusSchema>;
export type ToolCall = z.infer<typeof ToolCallSchema>;
export type Message = z.infer<typeof MessageSchema>;

// ---------------------------------------------------------------------------
// Server MessageRecord (ENGINE_API format)
// ---------------------------------------------------------------------------

/**
 * Raw message shape returned by `GET /sessions/{id}`.
 * Fields map to the ENGINE_API `MessageRecord` definition.
 */
export interface ServerMessageRecord {
  id: string;
  role: 'user' | 'assistant';
  content: string | null;
  taskId: string;
  taskStatus: 'CREATED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SUSPENDED';
  createdAt: string;
}

/**
 * Derives a front-end `MessageStatus` from the server-side `taskStatus`.
 */
function taskStatusToMessageStatus(taskStatus: string, role: string): MessageStatus {
  if (role === 'user') return 'completed';
  switch (taskStatus) {
    case 'CREATED':
    case 'RUNNING':
      return 'streaming';
    case 'COMPLETED':
      return 'completed';
    case 'FAILED':
      return 'error';
    case 'SUSPENDED':
      return 'pending';
    default:
      return 'completed';
  }
}

/**
 * Converts an array of server `MessageRecord` objects into the local `Message`
 * shape used by the Zustand store and React components.
 */
export function normalizeServerMessages(records: ServerMessageRecord[]): Message[] {
  return records.map((rec) => ({
    id: rec.id,
    role: rec.role,
    content: rec.content ?? '',
    timestamp: new Date(rec.createdAt).getTime(),
    status: taskStatusToMessageStatus(rec.taskStatus, rec.role),
    taskId: rec.taskId,
    taskStatus: rec.taskStatus,
  }));
}

// ---------------------------------------------------------------------------
// Session Schemas (ENGINE_API: GET /sessions, GET /sessions/{id})
// ---------------------------------------------------------------------------

/**
 * Lifecycle status of a conversation session.
 *
 * - `active`  – session is in use.
 * - `deleted` – soft-deleted by user or system.
 */
export const SessionStatusSchema = z.enum(['active', 'deleted']);

/**
 * Single session entity returned by the Engine API.
 * Maps to `GET /sessions` list items and `GET /sessions/{id}` detail.
 *
 * This schema is the **single source of truth** for all session data flowing
 * through the sidebar and query hooks.
 */
export const SessionItemSchema = z.object({
  id: z.string(),
  tenantId: z.string().optional(),
  agentId: z.string().nullable().optional(),
  modelId: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  title: z.string(),
  status: SessionStatusSchema,
  lastMessageAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SessionStatus = z.infer<typeof SessionStatusSchema>;
export type SessionItem = z.infer<typeof SessionItemSchema>;
