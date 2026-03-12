import {
  engineApiClient,
  mcpApiClient,
  type ApiResponse,
  unwrap,
} from './client';
import type {
  Workflow,
  WorkflowSummary,
  WorkflowListParams,
  WorkflowListResponse,
  CreateWorkflowPayload,
  UpdateWorkflowPayload,
  RunWorkflowResponse,
  TaskSummary,
  TaskSummaryListResponse,
  RunDetail,
  DependencyItem,
  WorkflowGroup,
  WorkflowGroupListResponse,
  CreateGroupPayload,
  UpdateGroupPayload,
} from '@/schemas/workflowEditorSchema';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Loose paginated shape the backend may return instead of a flat array.
 * Some endpoints use `items`, others `content`; total field may be
 * `total` or `totalElements`.
 */
interface PaginatedRaw<T> {
  items?: T[];
  content?: T[];
  total?: number;
  totalElements?: number;
  page?: number;
  size?: number;
}

/**
 * Backend may return `data` as a raw array or as a paginated object
 * `{ items, total, page, size }`. Normalize both into the paginated shape.
 */
function normalizePaginated<T>(
  raw: T[] | PaginatedRaw<T>,
  params: { page?: number; size?: number },
): { items: T[]; total: number; page: number; size: number } {
  if (Array.isArray(raw)) {
    return {
      items: raw,
      total: raw.length,
      page: params.page ?? 1,
      size: params.size ?? raw.length,
    };
  }
  const items = raw.items ?? raw.content ?? [];
  return {
    items,
    total: Number(raw.total ?? raw.totalElements ?? 0),
    page: Number(raw.page ?? params.page ?? 1),
    size: Number(raw.size ?? params.size ?? 10),
  };
}

// ---------------------------------------------------------------------------
// Workflow CRUD
// ---------------------------------------------------------------------------

export async function fetchWorkflows(params: WorkflowListParams = {}): Promise<WorkflowListResponse> {
  const res: ApiResponse<WorkflowSummary[] | PaginatedRaw<WorkflowSummary>> = await engineApiClient.get(
    '/workflows',
    { params },
  );
  return normalizePaginated(unwrap(res), params);
}

export async function fetchWorkflowById(id: string): Promise<Workflow> {
  const res: ApiResponse<Workflow> = await engineApiClient.get(`/workflows/${id}`);
  return unwrap(res);
}

export async function createWorkflow(payload: CreateWorkflowPayload): Promise<Workflow> {
  const res: ApiResponse<Workflow> = await engineApiClient.post('/workflows', payload);
  return unwrap(res);
}

export async function updateWorkflow(id: string, payload: UpdateWorkflowPayload): Promise<Workflow> {
  const res: ApiResponse<Workflow> = await engineApiClient.put(`/workflows/${id}`, payload);
  return unwrap(res);
}

export async function deleteWorkflow(id: string): Promise<void> {
  const res: ApiResponse<null> = await engineApiClient.delete(`/workflows/${id}`);
  unwrap(res);
}

// ---------------------------------------------------------------------------
// Publish / Unpublish
// ---------------------------------------------------------------------------

export async function publishWorkflow(id: string): Promise<Workflow> {
  const res: ApiResponse<Workflow> = await engineApiClient.post(`/workflows/${id}/publish`);
  return unwrap(res);
}

export async function unpublishWorkflow(id: string): Promise<Workflow> {
  const res: ApiResponse<Workflow> = await engineApiClient.post(`/workflows/${id}/unpublish`);
  return unwrap(res);
}

// ---------------------------------------------------------------------------
// Run / Test-run
// ---------------------------------------------------------------------------

export async function runWorkflow(id: string): Promise<RunWorkflowResponse> {
  const res: ApiResponse<RunWorkflowResponse> = await engineApiClient.post(`/workflows/${id}/run`, {});
  return unwrap(res);
}

export async function testRunWorkflow(
  id: string,
  payload: { message?: string; modelId?: string } = {},
): Promise<RunWorkflowResponse> {
  const res: ApiResponse<RunWorkflowResponse> = await engineApiClient.post(`/workflows/${id}/test-run`, payload);
  return unwrap(res);
}

// ---------------------------------------------------------------------------
// Run history
// ---------------------------------------------------------------------------

interface RunListParams {
  status?: string;
  page?: number;
  size?: number;
}

export async function fetchWorkflowRuns(
  workflowId: string,
  params: RunListParams = {},
): Promise<TaskSummaryListResponse> {
  const res: ApiResponse<TaskSummary[] | PaginatedRaw<TaskSummary>> = await engineApiClient.get(
    `/workflows/${workflowId}/runs`,
    { params },
  );
  return normalizePaginated(unwrap(res), params);
}

export async function fetchRunDetail(taskId: string): Promise<RunDetail> {
  const res: ApiResponse<RunDetail> = await engineApiClient.get(`/workflows/runs/${taskId}`);
  return unwrap(res);
}

// ---------------------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------------------

export async function checkDependencies(workflowId: string): Promise<DependencyItem[]> {
  const res: ApiResponse<DependencyItem[]> = await engineApiClient.get(`/workflows/${workflowId}/dependencies`);
  return unwrap(res);
}

// ---------------------------------------------------------------------------
// Workflow Groups
// ---------------------------------------------------------------------------

interface GroupListParams {
  name?: string;
  page?: number;
  size?: number;
}

export async function fetchGroups(params: GroupListParams = {}): Promise<WorkflowGroupListResponse> {
  const res: ApiResponse<WorkflowGroup[] | PaginatedRaw<WorkflowGroup>> = await engineApiClient.get(
    '/workflow-groups',
    { params },
  );
  return normalizePaginated(unwrap(res), params);
}

export async function fetchGroupById(id: string): Promise<WorkflowGroup> {
  const res: ApiResponse<WorkflowGroup> = await engineApiClient.get(`/workflow-groups/${id}`);
  return unwrap(res);
}

export async function createGroup(payload: CreateGroupPayload): Promise<WorkflowGroup> {
  const res: ApiResponse<WorkflowGroup> = await engineApiClient.post('/workflow-groups', payload);
  return unwrap(res);
}

export async function updateGroup(id: string, payload: UpdateGroupPayload): Promise<WorkflowGroup> {
  const res: ApiResponse<WorkflowGroup> = await engineApiClient.put(`/workflow-groups/${id}`, payload);
  return unwrap(res);
}

export async function deleteGroup(id: string): Promise<void> {
  const res: ApiResponse<null> = await engineApiClient.delete(`/workflow-groups/${id}`);
  unwrap(res);
}

export async function addWorkflowToGroup(groupId: string, workflowId: string): Promise<void> {
  const res: ApiResponse<null> = await engineApiClient.post(`/workflow-groups/${groupId}/workflows/${workflowId}`);
  unwrap(res);
}

export async function removeWorkflowFromGroup(groupId: string, workflowId: string): Promise<void> {
  const res: ApiResponse<null> = await engineApiClient.delete(`/workflow-groups/${groupId}/workflows/${workflowId}`);
  unwrap(res);
}

export async function fetchGroupWorkflows(
  groupId: string,
  params: { page?: number; size?: number } = {},
): Promise<WorkflowListResponse> {
  const res: ApiResponse<WorkflowSummary[] | PaginatedRaw<WorkflowSummary>> = await engineApiClient.get(
    `/workflow-groups/${groupId}/workflows`,
    { params },
  );
  return normalizePaginated(unwrap(res), params);
}

export async function fetchWorkflowGroups(workflowId: string): Promise<WorkflowGroup[]> {
  const res: ApiResponse<WorkflowGroup[]> = await engineApiClient.get(`/workflow-groups/by-workflow/${workflowId}`);
  return unwrap(res);
}

// ---------------------------------------------------------------------------
// MCP Servers (user catalog — for workflow editor tools sidebar)
// ---------------------------------------------------------------------------

export interface McpServerTool {
  id: string;
  name: string;
  description?: string;
  parameters?: string;
  enabled?: boolean | null;
}

export interface McpServerCatalog {
  id: string;
  serverCode: string;
  name: string;
  description?: string;
  icon?: string;
  runtimeMode?: string;
  supportsStreaming?: boolean;
  toolCount?: number;
  tools?: McpServerTool[];
  categories?: string[];
}

export async function fetchMcpServers(): Promise<McpServerCatalog[]> {
  const res: ApiResponse<McpServerCatalog[]> = await mcpApiClient.get('/mcp/user/mcp-servers');
  return unwrap(res);
}
