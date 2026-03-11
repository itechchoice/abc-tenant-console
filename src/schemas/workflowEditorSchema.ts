import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const WorkflowStatusSchema = z.enum(['draft', 'published', 'deleted']);
export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;

export const DslNodeTypeSchema = z.enum(['MODEL', 'TOOL', 'AGENT']);
export type DslNodeType = z.infer<typeof DslNodeTypeSchema>;

// ---------------------------------------------------------------------------
// DSL structure (aligned with backend API)
// ---------------------------------------------------------------------------

export const DslNodeConfigSchema = z.object({
  prompt: z.string().optional(),
  conditionPrompt: z.string().optional(),
  // MODEL
  modelId: z.string().optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  // TOOL — format: "serverCode:toolName"
  tool: z.string().optional(),
  // AGENT
  agentId: z.string().optional(),
}).catchall(z.unknown());
export type DslNodeConfig = z.infer<typeof DslNodeConfigSchema>;

export const DslNodeSchema = z.object({
  id: z.string(),
  type: DslNodeTypeSchema,
  config: DslNodeConfigSchema.optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number().optional(),
  }).optional(),
});
export type DslNode = z.infer<typeof DslNodeSchema>;

/** API edge — only source/target, no id */
export const ApiEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
});
export type ApiEdge = z.infer<typeof ApiEdgeSchema>;

/** Frontend edge — extends API edge with React Flow required `id` */
export const DslEdgeSchema = ApiEdgeSchema.extend({
  id: z.string(),
});
export type DslEdge = z.infer<typeof DslEdgeSchema>;

export const DslGraphSchema = z.object({
  nodes: z.array(DslNodeSchema),
  edges: z.array(ApiEdgeSchema),
});
export type DslGraph = z.infer<typeof DslGraphSchema>;

// ---------------------------------------------------------------------------
// Workflow entity
// ---------------------------------------------------------------------------

export const WorkflowSummarySchema = z.object({
  id: z.string(),
  tenantId: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  version: z.number().optional(),
  status: WorkflowStatusSchema,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type WorkflowSummary = z.infer<typeof WorkflowSummarySchema>;

export const WorkflowSchema = WorkflowSummarySchema.extend({
  definition: DslGraphSchema.optional(),
  tags: z.array(z.string()).nullable().optional(),
  createdBy: z.string().nullable().optional(),
});
export type Workflow = z.infer<typeof WorkflowSchema>;

// ---------------------------------------------------------------------------
// List response (paginated)
// ---------------------------------------------------------------------------

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    size: z.number(),
  });

export const WorkflowListResponseSchema = PaginatedResponseSchema(WorkflowSummarySchema);
export type WorkflowListResponse = z.infer<typeof WorkflowListResponseSchema>;

// ---------------------------------------------------------------------------
// Tool (for sidebar — unchanged, not part of workflow API)
// ---------------------------------------------------------------------------

export const ToolCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const ToolItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: ToolCategorySchema.optional(),
  icon: z.string().optional(),
});
export type ToolItem = z.infer<typeof ToolItemSchema>;

// ---------------------------------------------------------------------------
// API params
// ---------------------------------------------------------------------------

export const WorkflowListParamsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  name: z.string().optional(),
  status: WorkflowStatusSchema.optional(),
  groupId: z.string().optional(),
});
export type WorkflowListParams = z.infer<typeof WorkflowListParamsSchema>;

export const CreateWorkflowPayloadSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  definition: DslGraphSchema.optional(),
});
export type CreateWorkflowPayload = z.infer<typeof CreateWorkflowPayloadSchema>;

export const UpdateWorkflowPayloadSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  definition: DslGraphSchema.optional(),
});
export type UpdateWorkflowPayload = z.infer<typeof UpdateWorkflowPayloadSchema>;

// ---------------------------------------------------------------------------
// Workflow Groups
// ---------------------------------------------------------------------------

export const WorkflowGroupSchema = z.object({
  id: z.string(),
  tenantId: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  sortOrder: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type WorkflowGroup = z.infer<typeof WorkflowGroupSchema>;

export const WorkflowGroupListResponseSchema = PaginatedResponseSchema(WorkflowGroupSchema);
export type WorkflowGroupListResponse = z.infer<typeof WorkflowGroupListResponseSchema>;

export const CreateGroupPayloadSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  sortOrder: z.number().optional(),
});
export type CreateGroupPayload = z.infer<typeof CreateGroupPayloadSchema>;

export const UpdateGroupPayloadSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().optional(),
});
export type UpdateGroupPayload = z.infer<typeof UpdateGroupPayloadSchema>;

// ---------------------------------------------------------------------------
// Run / Task
// ---------------------------------------------------------------------------

export const TaskSummarySchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  status: z.string(),
  intent: z.string().optional(),
  error: z.string().optional(),
  createdAt: z.string().optional(),
  completedAt: z.string().optional(),
});
export type TaskSummary = z.infer<typeof TaskSummarySchema>;

export const TaskSummaryListResponseSchema = PaginatedResponseSchema(TaskSummarySchema);
export type TaskSummaryListResponse = z.infer<typeof TaskSummaryListResponseSchema>;

export const RunDetailSchema = z.object({
  id: z.string(),
  tenantId: z.string().optional(),
  workflowId: z.string(),
  sessionId: z.string().optional(),
  status: z.string(),
  intent: z.string().optional(),
  result: z.string().optional(),
  createdAt: z.string().optional(),
  completedAt: z.string().optional(),
});
export type RunDetail = z.infer<typeof RunDetailSchema>;

export const RunWorkflowResponseSchema = z.object({
  taskId: z.string(),
  sessionId: z.string(),
});
export type RunWorkflowResponse = z.infer<typeof RunWorkflowResponseSchema>;

// ---------------------------------------------------------------------------
// Dependency check
// ---------------------------------------------------------------------------

export const DependencyItemSchema = z.object({
  serverCode: z.string(),
  authorized: z.boolean(),
});
export type DependencyItem = z.infer<typeof DependencyItemSchema>;
