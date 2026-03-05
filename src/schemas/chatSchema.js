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
  /** Unique identifier for this specific tool invocation. */
  id: z.string(),
  /** Canonical tool name (e.g. `"web_search"`, `"code_interpreter"`). */
  name: z.string(),
  /** Arbitrary JSON arguments forwarded to the tool runtime. */
  args: z.record(z.any()).optional(),
  /** Raw result payload returned by the tool, if available. */
  result: z.any().optional(),
  /** Current execution status of the tool call. */
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
  /** UUID v4 uniquely identifying this message across sessions. */
  id: z.string(),
  /** Author role for this conversation turn. */
  role: MessageRoleSchema,
  /** Primary textual content (may be empty for pure tool-call messages). */
  content: z.string(),
  /** Unix-epoch millisecond timestamp of message creation. */
  timestamp: z.number(),
  /** Lifecycle status within the streaming pipeline. */
  status: MessageStatusSchema,
  /** Ordered list of tool calls attached to this message (assistant only). */
  toolCalls: z.array(ToolCallSchema).optional(),
  /** Extensible metadata bag (model name, token usage, latency, etc.). */
  metadata: z.record(z.any()).optional(),
});

// ---------------------------------------------------------------------------
// Derived JSDoc typedefs – consumed via `@import` in consuming modules so
// that VS Code / Cursor IntelliSense resolves full structural hints in
// pure-JS files without any TypeScript compilation.
// ---------------------------------------------------------------------------

/** @typedef {z.infer<typeof MessageRoleSchema>} MessageRole */
/** @typedef {z.infer<typeof MessageStatusSchema>} MessageStatus */
/** @typedef {z.infer<typeof ToolCallStatusSchema>} ToolCallStatus */
/** @typedef {z.infer<typeof ToolCallSchema>} ToolCall */
/** @typedef {z.infer<typeof MessageSchema>} Message */

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
  /** Unique session identifier. */
  id: z.string(),
  /** Owning tenant. */
  tenantId: z.string().optional(),
  /** Agent bound to this session (Agent mode). */
  agentId: z.string().nullable().optional(),
  /** Model bound to this session (direct-model mode). */
  modelId: z.string().nullable().optional(),
  /** Originating user. */
  userId: z.string().nullable().optional(),
  /** Human-readable session title. */
  title: z.string(),
  /** Lifecycle status. */
  status: SessionStatusSchema,
  /** ISO-8601 timestamp of the last message in this session. */
  lastMessageAt: z.string().nullable().optional(),
  /** ISO-8601 creation timestamp. */
  createdAt: z.string(),
  /** ISO-8601 last-update timestamp. */
  updatedAt: z.string(),
});

/** @typedef {z.infer<typeof SessionStatusSchema>} SessionStatus */
/** @typedef {z.infer<typeof SessionItemSchema>} SessionItem */
