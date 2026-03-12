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

export interface PublishCheckResponse {
  canPublish: boolean;
  needsTenantConfig: boolean;
  tenantConfigCompleted: boolean;
  missingConfigItems: Array<{
    name: string;
    key: string;
    category: string;
    description: string;
    required: boolean;
  }>;
  message: string;
}

export async function checkPublish(serverId: string): Promise<PublishCheckResponse> {
  const res: ApiResponse<PublishCheckResponse> = await mcpApiClient.get(
    `${ADMIN_SERVERS}/${serverId}/publish-check`,
  );
  return unwrap(res);
}

export async function publishServer(serverId: string): Promise<PublishCheckResponse> {
  const res: ApiResponse<PublishCheckResponse> = await mcpApiClient.post(
    `${ADMIN_SERVERS}/${serverId}/publish`,
  );
  return unwrap(res);
}

export async function unpublishServer(serverId: string): Promise<PublishCheckResponse> {
  const res: ApiResponse<PublishCheckResponse> = await mcpApiClient.post(
    `${ADMIN_SERVERS}/${serverId}/unpublish`,
  );
  return unwrap(res);
}

export interface OAuthInitResponse {
  redirectUrl?: string;
  success?: boolean;
  connectionId?: string;
  message?: string;
}

export async function initiateOAuthConnect(
  serverId: string,
  returnUrl: string,
): Promise<OAuthInitResponse> {
  const res: ApiResponse<OAuthInitResponse> = await mcpApiClient.post(
    `/mcp/user/servers/${serverId}/auth`,
    { returnUrl },
  );
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
// User connection status per server
// ---------------------------------------------------------------------------

export interface UserConnectionServer {
  serverId: string;
  serverCode?: string;
  serverName?: string;
  authType?: string;
  connectionId?: string;
  connectionName?: string;
  connectionStatus?: 'ACTIVE' | 'DISABLED' | 'PENDING';
  isTest?: boolean;
  connectedAt?: string;
  connectionUpdatedAt?: string;
}

export async function fetchUserConnectionServers(): Promise<UserConnectionServer[]> {
  const res: ApiResponse<UserConnectionServer[]> = await mcpApiClient.get(
    '/mcp/user/connections/servers',
  );
  return unwrap(res);
}

// ---------------------------------------------------------------------------
// User display preference per server
// ---------------------------------------------------------------------------

export interface UserMcpDisplay {
  serverId: number | string;
  serverCode?: string;
  serverName?: string;
  icon?: string;
  display: boolean;
  updatedAt?: string;
  message?: string;
}

export interface UpdateDisplayPayload {
  servers: Array<{ serverId: number | string; display: boolean }>;
}

export async function fetchUserMcpDisplay(): Promise<UserMcpDisplay[]> {
  const res: ApiResponse<UserMcpDisplay[]> = await mcpApiClient.get(
    '/mcp/user/mcp-servers/display',
  );
  return unwrap(res);
}

export async function updateUserMcpDisplay(payload: UpdateDisplayPayload): Promise<UserMcpDisplay[]> {
  const res: ApiResponse<UserMcpDisplay[]> = await mcpApiClient.put(
    '/mcp/user/mcp-servers/display',
    payload,
  );
  return unwrap(res);
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
