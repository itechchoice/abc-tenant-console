import { z } from 'zod';

export const WorkflowPanelPhaseSchema = z.enum(['idle', 'live', 'review']);

export const WorkflowExecutionStatusSchema = z.enum([
  'idle',
  'preparing',
  'running',
  'waiting',
  'completed',
  'failed',
]);

export const WorkflowStepStatusSchema = z.enum([
  'pending',
  'running',
  'waiting',
  'completed',
  'failed',
]);

export const WorkflowStepKindSchema = z.enum([
  'phase',
  'tool',
  'interaction',
  'system',
]);

export const WorkflowNodeKeySchema = z.enum([
  'understand',
  'plan',
  'retrieve',
  'decide',
  'ask-user',
  'respond',
  'prompt',
  'model',
  'response',
]);

export const WorkflowRuntimeStepSchema = z.object({
  id: z.string(),
  kind: WorkflowStepKindSchema,
  title: z.string(),
  detail: z.string().optional(),
  nodeKey: WorkflowNodeKeySchema,
  status: WorkflowStepStatusSchema,
  startedAt: z.number(),
  endedAt: z.number().nullable().optional(),
  messageId: z.string().nullable().optional(),
  taskId: z.string().nullable().optional(),
  toolName: z.string().nullable().optional(),
  args: z.any().optional(),
  result: z.any().optional(),
  error: z.string().nullable().optional(),
});

export const WorkflowExecutionSummarySchema = z.object({
  finalState: z.enum(['direct', 'workflow', 'interaction_required', 'failed']),
  status: WorkflowExecutionStatusSchema,
  stepCount: z.number().int().nonnegative(),
  toolNames: z.array(z.string()),
  completedAt: z.number(),
  durationMs: z.number().nonnegative(),
  headline: z.string(),
});

/** @typedef {z.infer<typeof WorkflowPanelPhaseSchema>} WorkflowPanelPhase */
/** @typedef {z.infer<typeof WorkflowExecutionStatusSchema>} WorkflowExecutionStatus */
/** @typedef {z.infer<typeof WorkflowStepStatusSchema>} WorkflowStepStatus */
/** @typedef {z.infer<typeof WorkflowStepKindSchema>} WorkflowStepKind */
/** @typedef {z.infer<typeof WorkflowNodeKeySchema>} WorkflowNodeKey */
/** @typedef {z.infer<typeof WorkflowRuntimeStepSchema>} WorkflowRuntimeStep */
/** @typedef {z.infer<typeof WorkflowExecutionSummarySchema>} WorkflowExecutionSummary */
