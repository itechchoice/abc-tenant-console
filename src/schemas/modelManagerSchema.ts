import { z } from 'zod';

// ── Provider ──

export const ProviderTypeSchema = z.enum(['OPENAI', 'ANTHROPIC', 'GEMINI']);
export type ProviderType = z.infer<typeof ProviderTypeSchema>;

export const ProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  providerType: ProviderTypeSchema,
  baseUrl: z.string(),
  enabled: z.boolean(),
  configJson: z.record(z.string(), z.unknown()).nullable().optional(),
  hasApiKey: z.boolean(),
  createdBy: z.number().optional(),
  updatedBy: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Provider = z.infer<typeof ProviderSchema>;

export const CreateProviderPayloadSchema = z.object({
  name: z.string().min(1),
  providerType: ProviderTypeSchema,
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  configJson: z.record(z.string(), z.unknown()).optional(),
});
export type CreateProviderPayload = z.infer<typeof CreateProviderPayloadSchema>;

export const UpdateProviderPayloadSchema = z.object({
  name: z.string().optional(),
  providerType: ProviderTypeSchema.optional(),
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  configJson: z.record(z.string(), z.unknown()).optional(),
});
export type UpdateProviderPayload = z.infer<typeof UpdateProviderPayloadSchema>;

// ── Model ──

export const ModelTypeSchema = z.enum(['CHAT', 'EMBEDDING']);
export type ModelType = z.infer<typeof ModelTypeSchema>;

export const ModelResponseSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  modelId: z.string(),
  displayName: z.string().optional(),
  modelType: ModelTypeSchema,
  enabled: z.boolean(),
  inputPricePer1kTokens: z.number().optional(),
  outputPricePer1kTokens: z.number().optional(),
  configJson: z.record(z.string(), z.unknown()).nullable().optional(),
  createdBy: z.number().optional(),
  updatedBy: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ModelResponse = z.infer<typeof ModelResponseSchema>;

export const CreateModelPayloadSchema = z.object({
  modelId: z.string().min(1),
  displayName: z.string().optional(),
  modelType: ModelTypeSchema,
  inputPricePer1kTokens: z.number().optional(),
  outputPricePer1kTokens: z.number().optional(),
  configJson: z.record(z.string(), z.unknown()).optional(),
});
export type CreateModelPayload = z.infer<typeof CreateModelPayloadSchema>;

export const UpdateModelPayloadSchema = z.object({
  displayName: z.string().optional(),
  modelType: ModelTypeSchema.optional(),
  inputPricePer1kTokens: z.number().optional(),
  outputPricePer1kTokens: z.number().optional(),
  configJson: z.record(z.string(), z.unknown()).optional(),
});
export type UpdateModelPayload = z.infer<typeof UpdateModelPayloadSchema>;

// ── Model Pool ──

export const PoolStrategySchema = z.enum(['ROUND_ROBIN', 'RANDOM', 'PRIORITY', 'WEIGHTED']);
export type PoolStrategy = z.infer<typeof PoolStrategySchema>;

export const ModelPoolSchema = z.object({
  id: z.string(),
  poolName: z.string(),
  strategy: PoolStrategySchema,
  enabled: z.boolean(),
  createdBy: z.number().optional(),
  updatedBy: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ModelPool = z.infer<typeof ModelPoolSchema>;

export const CreatePoolPayloadSchema = z.object({
  poolName: z.string().min(1),
  strategy: PoolStrategySchema,
});
export type CreatePoolPayload = z.infer<typeof CreatePoolPayloadSchema>;

export const UpdatePoolPayloadSchema = z.object({
  poolName: z.string().optional(),
  strategy: PoolStrategySchema.optional(),
});
export type UpdatePoolPayload = z.infer<typeof UpdatePoolPayloadSchema>;

// ── Pool Member ──

export const PoolMemberSchema = z.object({
  id: z.string(),
  poolId: z.string(),
  modelId: z.string(),
  modelName: z.string(),
  priority: z.number(),
  weight: z.number(),
});
export type PoolMember = z.infer<typeof PoolMemberSchema>;

export const AddPoolMemberPayloadSchema = z.object({
  modelId: z.string().min(1),
  priority: z.number().optional(),
  weight: z.number().optional(),
});
export type AddPoolMemberPayload = z.infer<typeof AddPoolMemberPayloadSchema>;

// ── Paginated response ──

export const PageResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    content: z.array(itemSchema),
    totalElements: z.number(),
    totalPages: z.number(),
    size: z.number(),
    number: z.number(),
    first: z.boolean(),
    last: z.boolean(),
    empty: z.boolean(),
  });

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

// ── Constants ──

export const PROVIDER_TYPES: { value: ProviderType; label: string }[] = [
  { value: 'OPENAI', label: 'OpenAI' },
  { value: 'ANTHROPIC', label: 'Anthropic' },
  { value: 'GEMINI', label: 'Google Gemini' },
];

export const MODEL_TYPES: { value: ModelType; label: string }[] = [
  { value: 'CHAT', label: 'Chat' },
  { value: 'EMBEDDING', label: 'Embedding' },
];

export const POOL_STRATEGIES: { value: PoolStrategy; label: string; desc: string }[] = [
  { value: 'ROUND_ROBIN', label: 'Round Robin', desc: 'Rotate through members sequentially' },
  { value: 'RANDOM', label: 'Random', desc: 'Randomly select a member' },
  { value: 'PRIORITY', label: 'Priority', desc: 'Select by highest priority first' },
  { value: 'WEIGHTED', label: 'Weighted', desc: 'Distribute traffic by weight ratio' },
];
