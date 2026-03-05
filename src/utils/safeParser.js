// ---------------------------------------------------------------------------
// Return-type typedefs
// ---------------------------------------------------------------------------

/**
 * Successful parse result.
 *
 * @typedef {object} SafeParseSuccess
 * @property {true}   success
 * @property {unknown} data – The validated (or raw-parsed) object.
 */

/**
 * Failed parse result.  The caller can inspect `error` to decide whether
 * it was a JSON syntax issue, a schema mismatch, or an unexpected crash.
 *
 * @typedef {object} SafeParseFailure
 * @property {false}  success
 * @property {string} error
 *   One of `'Invalid JSON format'` | `'Schema validation failed'` |
 *   `'Unexpected parse error'`.
 * @property {import('zod').ZodError} [details]
 *   Present only when `error === 'Schema validation failed'`.
 *   Contains per-field issue descriptors useful for UI error rendering.
 * @property {string} raw – The original `jsonString` for diagnostics.
 */

/**
 * Discriminated union returned by {@link safeParseAIJson}.
 *
 * @typedef {SafeParseSuccess | SafeParseFailure} SafeParseResult
 */

// ---------------------------------------------------------------------------
// Core utility
// ---------------------------------------------------------------------------

/**
 * Defensively parse a JSON string that originates from an LLM or any
 * untrusted external source.
 *
 * **Guarantee:** this function **never** throws.  Every failure mode is
 * captured and returned as a structured `{ success: false, ... }` result
 * so that callers can handle errors gracefully without risking a React
 * tree crash (white-screen).
 *
 * @param {string} jsonString – Raw JSON text to parse.
 * @param {import('zod').ZodType | null} [schema=null]
 *   Optional Zod schema.  When provided, the parsed object is validated
 *   against it via `safeParse`.  When omitted, only `JSON.parse` is run.
 * @returns {SafeParseResult}
 *
 * @example
 * ```js
 * import { safeParseAIJson } from '@/utils/safeParser';
 * import { interactionPayloadSchema } from '@/schemas/aiResponseSchemas';
 *
 * const result = safeParseAIJson(rawString, interactionPayloadSchema);
 * if (result.success) {
 *   // result.data is fully validated
 * } else {
 *   console.warn(result.error, result.details);
 * }
 * ```
 */
export function safeParseAIJson(jsonString, schema = null) {
  try {
    // ── Stage 1: JSON syntax ────────────────────────────────────────
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return {
        success: false,
        error: 'Invalid JSON format',
        raw: jsonString,
      };
    }

    // ── Stage 2: Schema validation (optional) ───────────────────────
    if (schema) {
      const validation = schema.safeParse(parsed);
      if (!validation.success) {
        return {
          success: false,
          error: 'Schema validation failed',
          details: validation.error,
          raw: jsonString,
        };
      }
      return { success: true, data: validation.data };
    }

    // No schema provided — return the raw parsed value as-is.
    return { success: true, data: parsed };
  } catch {
    // Ultimate safety net — catches anything we failed to anticipate
    // (e.g. a bug inside zod itself).
    return {
      success: false,
      error: 'Unexpected parse error',
      raw: jsonString,
    };
  }
}
