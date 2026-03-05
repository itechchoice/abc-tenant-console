import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enum Schemas
// ---------------------------------------------------------------------------

/**
 * LLM provider backend type.
 *
 * - `openai`    – OpenAI-compatible API (also used by DeepSeek, Moonshot, etc.)
 * - `anthropic` – Anthropic Claude API.
 * - `azure`     – Azure OpenAI Service.
 * - `custom`    – Self-hosted or non-standard endpoint.
 */
export const ProviderTypeSchema = z.enum([
  'openai',
  'anthropic',
  'azure',
  'custom',
]);

export const ProviderStatusSchema = z.enum(['active', 'deleted']);

// ---------------------------------------------------------------------------
// AssignedProvider — GET /models/providers/assigned
// ---------------------------------------------------------------------------

/**
 * Provider entity returned by the LLM Gateway when querying tenant-scoped
 * availability (`GET /models/providers/assigned`).
 *
 * Contains both platform-level providers (tenantId = "system") assigned to
 * the tenant, and tenant-owned providers.
 */
export const AssignedProviderSchema = z.object({
  /** Unique provider identifier. */
  id: z.string(),
  /** Owning tenant — `"system"` for platform-level providers. */
  tenantId: z.string().optional(),
  /** Human-readable provider name (e.g. "OpenAI", "My DeepSeek"). */
  name: z.string(),
  /** Backend API compatibility type (extensible — backends may register custom types). */
  type: z.string(),
  /** Masked API key (read-only, never sent in full). */
  apiKey: z.string().nullable().optional(),
  /** Provider base URL. */
  baseUrl: z.string().nullable().optional(),
  /** JSON-encoded extra configuration. */
  config: z.string().nullable().optional(),
  /** Lifecycle status. */
  status: ProviderStatusSchema,
  /** ISO-8601 creation timestamp. */
  createdAt: z.string().optional(),
  /** ISO-8601 last-update timestamp. */
  updatedAt: z.string().optional(),
});

// ---------------------------------------------------------------------------
// ModelDefinition — GET /models/providers/{id}/models
// ---------------------------------------------------------------------------

export const ModelCategorySchema = z.enum(['chat', 'embedding', 'completion']);

/**
 * Individual model definition registered under a provider.
 */
export const ModelDefinitionSchema = z.object({
  /** Unique model-definition ID. */
  id: z.string(),
  /** Parent provider ID. */
  providerId: z.string(),
  /** Canonical model identifier (e.g. `"gpt-4o"`, `"claude-3-5-sonnet"`). */
  modelId: z.string(),
  /** UI display name. */
  displayName: z.string().optional(),
  /** Functional category. */
  category: ModelCategorySchema.optional(),
  /** Context window size in tokens. */
  maxTokens: z.number().optional(),
  /** JSON-encoded capability flags. */
  capabilities: z.string().optional(),
  /** Lifecycle status. */
  status: ProviderStatusSchema,
  /** ISO-8601 creation timestamp. */
  createdAt: z.string().optional(),
});

// ---------------------------------------------------------------------------
// JSDoc typedefs
// ---------------------------------------------------------------------------

/** @typedef {z.infer<typeof ProviderTypeSchema>} ProviderType */
/** @typedef {z.infer<typeof ProviderStatusSchema>} ProviderStatus */
/** @typedef {z.infer<typeof AssignedProviderSchema>} AssignedProvider */
/** @typedef {z.infer<typeof ModelCategorySchema>} ModelCategory */
/** @typedef {z.infer<typeof ModelDefinitionSchema>} ModelDefinition */
