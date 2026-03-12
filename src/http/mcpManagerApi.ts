import { mcpApiClient, type ApiResponse, unwrap } from './client';
import type {
  McpServer, McpCategory, McpListResponse, McpListParams,
  CreateMcpPayload, UpdateMcpPayload, McpTool,
  AuthParamConfig, AuthConfigTemplate, McpServerAuthConfig,
} from '@/schemas/mcpManagerSchema';

// ---------------------------------------------------------------------------
// MCP Server CRUD
// ---------------------------------------------------------------------------

const ADMIN_SERVERS = '/mcp/admin/servers';

export async function fetchMCPList(params: McpListParams = {}): Promise<McpListResponse> {
  const res: ApiResponse<McpListResponse> = await mcpApiClient.get(ADMIN_SERVERS, { params });
  return unwrap(res);
}

export async function fetchMCPDetail(serverId: string): Promise<McpServer> {
  const res: ApiResponse<McpServer> = await mcpApiClient.get(`${ADMIN_SERVERS}/${serverId}`);
  return unwrap(res);
}

export async function createMCP(payload: CreateMcpPayload): Promise<McpServer> {
  const res: ApiResponse<McpServer> = await mcpApiClient.post(ADMIN_SERVERS, payload);
  return unwrap(res);
}

export async function updateMCP(serverId: string, payload: UpdateMcpPayload): Promise<McpServer> {
  const res: ApiResponse<McpServer> = await mcpApiClient.put(`${ADMIN_SERVERS}/${serverId}`, payload);
  return unwrap(res);
}

export async function deleteMCP(serverId: string): Promise<void> {
  const res: ApiResponse<null> = await mcpApiClient.delete(`${ADMIN_SERVERS}/${serverId}`);
  unwrap(res);
}

export async function checkServerName(name: string): Promise<boolean> {
  const res: ApiResponse<boolean> = await mcpApiClient.get(`${ADMIN_SERVERS}/check-name`, {
    params: { name },
  });
  return unwrap(res);
}

export async function syncServerTools(serverId: string): Promise<McpTool[]> {
  const res: ApiResponse<McpTool[]> = await mcpApiClient.post(`${ADMIN_SERVERS}/${serverId}/sync`);
  return unwrap(res);
}

// ---------------------------------------------------------------------------
// Auth Param Config (per server)
// ---------------------------------------------------------------------------

export async function fetchServerAuthParams(serverId: string): Promise<AuthParamConfig[]> {
  const res: ApiResponse<AuthParamConfig[]> = await mcpApiClient.get(
    `${ADMIN_SERVERS}/${serverId}/auth-params`,
  );
  return unwrap(res);
}

export async function saveServerAuthParams(
  serverId: string,
  params: AuthParamConfig[],
): Promise<AuthParamConfig[]> {
  const res: ApiResponse<AuthParamConfig[]> = await mcpApiClient.put(
    `${ADMIN_SERVERS}/${serverId}/auth-params`,
    params,
  );
  return unwrap(res);
}

// ---------------------------------------------------------------------------
// Server Auth Config (system-level config values)
// ---------------------------------------------------------------------------

export async function fetchServerAuthConfig(serverId: string): Promise<McpServerAuthConfig> {
  const res: ApiResponse<McpServerAuthConfig> = await mcpApiClient.get(
    `${ADMIN_SERVERS}/${serverId}/auth-config`,
  );
  return unwrap(res);
}

export async function saveServerAuthConfig(
  serverId: string,
  configValues: Record<string, string>,
): Promise<McpServerAuthConfig> {
  const res: ApiResponse<McpServerAuthConfig> = await mcpApiClient.put(
    `${ADMIN_SERVERS}/${serverId}/auth-config`,
    { configValues },
  );
  return unwrap(res);
}

export async function deleteServerAuthConfig(serverId: string): Promise<void> {
  const res: ApiResponse<null> = await mcpApiClient.delete(
    `${ADMIN_SERVERS}/${serverId}/auth-config`,
  );
  unwrap(res);
}

// ---------------------------------------------------------------------------
// Auth Config Templates
// ---------------------------------------------------------------------------

const AUTH_TEMPLATES = '/mcp/admin/auth-params/templates';

export async function fetchAuthTemplates(): Promise<AuthConfigTemplate[]> {
  const res: ApiResponse<AuthConfigTemplate[]> = await mcpApiClient.get(AUTH_TEMPLATES);
  return unwrap(res);
}

export async function fetchAuthTemplate(authType: string): Promise<AuthConfigTemplate> {
  const res: ApiResponse<AuthConfigTemplate> = await mcpApiClient.get(`${AUTH_TEMPLATES}/${authType}`);
  return unwrap(res);
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const ADMIN_CATEGORIES = '/mcp/admin/categories';

export async function fetchCategories(): Promise<McpCategory[]> {
  const res: ApiResponse<McpCategory[]> = await mcpApiClient.get(ADMIN_CATEGORIES);
  return unwrap(res);
}

export async function createCategory(code: string): Promise<McpCategory> {
  const res: ApiResponse<McpCategory> = await mcpApiClient.post(ADMIN_CATEGORIES, { code });
  return unwrap(res);
}

export async function updateCategory(id: string, code: string): Promise<McpCategory> {
  const res: ApiResponse<McpCategory> = await mcpApiClient.put(`${ADMIN_CATEGORIES}/${id}`, { code });
  return unwrap(res);
}

export async function deleteCategory(id: string): Promise<void> {
  const res: ApiResponse<null> = await mcpApiClient.delete(`${ADMIN_CATEGORIES}/${id}`);
  unwrap(res);
}
