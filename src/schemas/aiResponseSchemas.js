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
export const toolCallArgsSchema = z.record(z.unknown());

/** @typedef {z.infer<typeof toolCallArgsSchema>} ToolCallArgs */

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
  /** Stable identifier used to key the widget value in the form submission. */
  id: z.string(),
  /** Visual control type. */
  type: z.enum(['input', 'select', 'button']),
  /** Human-readable label rendered above / beside the control. */
  label: z.string().optional(),
  /** Selectable values for `select`-type widgets. */
  options: z.array(z.any()).optional(),
  /** Whether the user must provide a value before submitting. */
  required: z.boolean().default(false),
});

/** @typedef {z.infer<typeof interactionWidgetSchema>} InteractionWidget */

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
  /** Ordered list of form controls to render. */
  widgets: z.array(interactionWidgetSchema),
  /** Correlation ID returned alongside the user's response. */
  interactionId: z.string().optional(),
});

/** @typedef {z.infer<typeof interactionPayloadSchema>} InteractionPayload */
