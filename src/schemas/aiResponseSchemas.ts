import { z } from 'zod';

// ---------------------------------------------------------------------------
// Tool Call Args
// ---------------------------------------------------------------------------

/**
 * Generic argument bag for any tool invocation issued by the LLM.
 *
 * Intentionally loose — the shape of `args` varies per tool, so we only
 * enforce that the value is a plain object while allowing arbitrary nested
 * keys to pass through.
 */
export const toolCallArgsSchema = z.record(z.string(), z.unknown());

export type ToolCallArgs = z.infer<typeof toolCallArgsSchema>;

// ---------------------------------------------------------------------------
// Interaction Widget
// ---------------------------------------------------------------------------

/**
 * Describes a single form control that the backend requests the client to
 * render when a `client_interaction` event is received.
 *
 * - `input`  — free-text input field.
 * - `select` — dropdown / radio group driven by `options`.
 * - `button` — action trigger (confirm, cancel, etc.).
 */
export const interactionWidgetSchema = z.object({
  id: z.string(),
  type: z.enum(['input', 'select', 'button']),
  label: z.string().optional(),
  options: z.array(z.any()).optional(),
  required: z.boolean().default(false),
});

export type InteractionWidget = z.infer<typeof interactionWidgetSchema>;

// ---------------------------------------------------------------------------
// Interaction Payload (full `client_interaction` event body)
// ---------------------------------------------------------------------------

/**
 * Complete payload carried by a `client_interaction` SSE event.
 *
 * The backend sends this when the agent needs the user to fill out a form
 * (e.g. confirm parameters, choose an option) before the workflow can
 * proceed.  The `widgets` array is rendered dynamically by the
 * `InteractionForm` component.
 */
export const interactionPayloadSchema = z.object({
  widgets: z.array(interactionWidgetSchema),
  interactionId: z.string().optional(),
});

export type InteractionPayload = z.infer<typeof interactionPayloadSchema>;
