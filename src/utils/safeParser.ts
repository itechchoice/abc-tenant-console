import type { ZodType, ZodError } from 'zod';

interface SafeParseSuccess {
  success: true;
  data: unknown;
}

interface SafeParseFailure {
  success: false;
  error: string;
  details?: ZodError;
  raw: string;
}

export type SafeParseResult = SafeParseSuccess | SafeParseFailure;

/**
 * Defensively parse a JSON string that originates from an LLM or any
 * untrusted external source.
 *
 * **Guarantee:** this function **never** throws.  Every failure mode is
 * captured and returned as a structured `{ success: false, ... }` result
 * so that callers can handle errors gracefully without risking a React
 * tree crash (white-screen).
 */
export function safeParseAIJson(
  jsonString: string,
  schema: ZodType | null = null,
): SafeParseResult {
  try {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return {
        success: false,
        error: 'Invalid JSON format',
        raw: jsonString,
      };
    }

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

    return { success: true, data: parsed };
  } catch {
    return {
      success: false,
      error: 'Unexpected parse error',
      raw: jsonString,
    };
  }
}
