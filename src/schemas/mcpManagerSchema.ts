import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const McpStatusSchema = z.enum(['ACTIVE', 'DISABLED']);
export type McpStatus = z.infer<typeof McpStatusSchema>;

export const RuntimeModeSchema = z.enum(['REMOTE', 'LOCAL']);
export type RuntimeMode = z.infer<typeof RuntimeModeSchema>;

export const AuthTypeSchema = z.enum([
  'NONE', 'API_KEY', 'BASIC', 'OAUTH2', 'BEARER_TOKEN', 'CUSTOM',
]);
export type AuthType = z.infer<typeof AuthTypeSchema>;

export const ParamTypeSchema = z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'SECRET']);
export type ParamType = z.infer<typeof ParamTypeSchema>;

export const ParamLocationSchema = z.enum(['HEADER', 'QUERY', 'BODY', 'COOKIE']);
export type ParamLocation = z.infer<typeof ParamLocationSchema>;

export const LevelScopeSchema = z.enum(['SYSTEM', 'USER']);
export type LevelScope = z.infer<typeof LevelScopeSchema>;

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------

export const McpCategorySchema = z.object({
  id: z.string(),
  code: z.string(),
  serverCount: z.number().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type McpCategory = z.infer<typeof McpCategorySchema>;

// ---------------------------------------------------------------------------
// Auth Param Config — per-server authentication parameter definition
// ---------------------------------------------------------------------------

export const AuthParamConfigSchema = z.object({
  id: z.string().nullish(),
  serverId: z.string().nullish(),
  paramKey: z.string(),
  paramName: z.string().nullish(),
  paramType: ParamTypeSchema,
  location: ParamLocationSchema,
  locationName: z.string().nullish(),
  levelScope: LevelScopeSchema,
  isRequired: z.boolean(),
  defaultValue: z.string().nullish(),
  validationRule: z.string().nullish(),
  description: z.string().nullish(),
  exampleValue: z.string().nullish(),
  sortOrder: z.number().nullish(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
});
export type AuthParamConfig = z.infer<typeof AuthParamConfigSchema>;

// ---------------------------------------------------------------------------
// Auth Config Template — predefined param templates per auth type
// ---------------------------------------------------------------------------

export const AuthConfigTemplateSchema = z.object({
  authType: z.string(),
  authTypeName: z.string().optional(),
  description: z.string().optional(),
  paramTemplates: z.array(AuthParamConfigSchema),
});
export type AuthConfigTemplate = z.infer<typeof AuthConfigTemplateSchema>;

// ---------------------------------------------------------------------------
// Server Auth Config — system-level auth config values
// ---------------------------------------------------------------------------

export const McpServerAuthConfigSchema = z.object({
  serverId: z.string(),
  configValues: z.record(z.string(), z.string()),
  updatedAt: z.string().optional(),
});
export type McpServerAuthConfig = z.infer<typeof McpServerAuthConfigSchema>;

// ---------------------------------------------------------------------------
// MCP Tool
// ---------------------------------------------------------------------------

export const McpToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  parameters: z.string().optional(),
  enabled: z.boolean().nullable().optional(),
});
export type McpTool = z.infer<typeof McpToolSchema>;

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

export const McpServerSchema = z.object({
  id: z.string(),
  serverCode: z.string(),
  name: z.string(),
  description: z.string().optional(),
  endpoint: z.string().optional(),
  authType: AuthTypeSchema,
  supportsStreaming: z.boolean().optional(),
  runtimeMode: RuntimeModeSchema.optional(),
  icon: z.string().optional(),
  status: McpStatusSchema,
  toolCount: z.number().optional(),
  tools: z.array(McpToolSchema).optional(),
  categories: z.array(z.string()).optional(),
  authParamConfigs: z.array(AuthParamConfigSchema).optional(),
  tenantId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type McpServer = z.infer<typeof McpServerSchema>;

// ---------------------------------------------------------------------------
// Paginated list response (Spring Data Page)
// ---------------------------------------------------------------------------

export const McpListResponseSchema = z.object({
  content: z.array(McpServerSchema),
  totalElements: z.number(),
  totalPages: z.number(),
  number: z.number(),
  size: z.number(),
  first: z.boolean().optional(),
  last: z.boolean().optional(),
});
export type McpListResponse = z.infer<typeof McpListResponseSchema>;

// ---------------------------------------------------------------------------
// API request params
// ---------------------------------------------------------------------------

export const McpListParamsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  name: z.string().optional(),
  runtimeMode: RuntimeModeSchema.optional(),
  categoryCode: z.string().optional(),
  status: McpStatusSchema.optional(),
  sort: z.string().optional(),
});
export type McpListParams = z.infer<typeof McpListParamsSchema>;

export const CreateMcpPayloadSchema = z.object({
  serverCode: z.string(),
  name: z.string(),
  description: z.string().optional(),
  endpoint: z.string().optional(),
  authType: AuthTypeSchema,
  supportsStreaming: z.boolean().optional(),
  runtimeMode: RuntimeModeSchema.optional(),
  icon: z.string().optional(),
  categories: z.string().optional(),
  authParamConfigs: z.array(AuthParamConfigSchema).optional(),
});
export type CreateMcpPayload = z.infer<typeof CreateMcpPayloadSchema>;

export const UpdateMcpPayloadSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  endpoint: z.string().optional(),
  authType: AuthTypeSchema.optional(),
  supportsStreaming: z.boolean().optional(),
  runtimeMode: RuntimeModeSchema.optional(),
  icon: z.string().optional(),
  status: McpStatusSchema.optional(),
  categories: z.string().optional(),
});
export type UpdateMcpPayload = z.infer<typeof UpdateMcpPayloadSchema>;
