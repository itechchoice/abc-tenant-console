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
  id: z.string(),
  tenantId: z.string().optional(),
  name: z.string(),
  type: z.string(),
  apiKey: z.string().nullable().optional(),
  baseUrl: z.string().nullable().optional(),
  config: z.string().nullable().optional(),
  status: ProviderStatusSchema,
  createdAt: z.string().optional(),
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
  id: z.string(),
  providerId: z.string(),
  modelId: z.string(),
  displayName: z.string().optional(),
  category: ModelCategorySchema.optional(),
  maxTokens: z.number().optional(),
  capabilities: z.string().optional(),
  status: ProviderStatusSchema,
  createdAt: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Derived TypeScript types
// ---------------------------------------------------------------------------

export type ProviderType = z.infer<typeof ProviderTypeSchema>;
export type ProviderStatus = z.infer<typeof ProviderStatusSchema>;
export type AssignedProvider = z.infer<typeof AssignedProviderSchema>;
export type ModelCategory = z.infer<typeof ModelCategorySchema>;
export type ModelDefinition = z.infer<typeof ModelDefinitionSchema>;
