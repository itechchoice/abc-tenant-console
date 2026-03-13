import { apiClient, type ApiResponse, mcpApiClient, unwrap } from './client';
import type { AuthParamConfig } from '@/schemas/mcpManagerSchema';

// ---------------------------------------------------------------------------
// User-side auth param definitions (only USER-level params are returned)
// ---------------------------------------------------------------------------

export async function fetchUserAuthParams(serverId: string): Promise<AuthParamConfig[]> {
  const res: ApiResponse<AuthParamConfig[]> = await apiClient.get(
    `/mcp/user/mcp-servers/${serverId}/auth-params`,
  );
  return unwrap(res);
}

// ---------------------------------------------------------------------------
// Step 4a: Non-OAuth2 — submit credentials, get { connectionId } back
// POST /mcp/mcp/user/servers/{id}/auth
// ---------------------------------------------------------------------------

export interface UserCredentialPayload {
  connectionName?: string;
  credentials?: Record<string, unknown>;
}

export interface UserCredentialResponse {
  success?: boolean;
  connectionId?: string;
  message?: string;
}

export async function submitUserCredentials(
  serverId: string,
  payload: UserCredentialPayload,
): Promise<UserCredentialResponse> {
  const res: ApiResponse<UserCredentialResponse> = await mcpApiClient.post(
    `/mcp/user/servers/${serverId}/auth`,
    payload,
  );
  return unwrap(res);
}

// ---------------------------------------------------------------------------
// Step 4b: OAuth2 — submit returnUrl, backend returns redirectUrl for popup
// POST /mcp/user/servers/{id}/auth
// After user authorizes on third-party, backend calls GET /mcp/auth/callback
// which redirects to returnUrl?auth=success&connectionId=xxx
// ---------------------------------------------------------------------------

export interface UserOAuth2Payload {
  returnUrl: string;
}

export interface UserOAuth2Response {
  redirectUrl?: string;
  success?: boolean;
  connectionId?: string;
  message?: string;
}

export async function initiateUserOAuth2(
  serverId: string,
  payload: UserOAuth2Payload,
): Promise<UserOAuth2Response> {
  const res: ApiResponse<UserOAuth2Response> = await mcpApiClient.post(
    `/mcp/user/servers/${serverId}/auth`,
    payload,
  );
  return unwrap(res);
}

// ---------------------------------------------------------------------------
// User-side auth status
// ---------------------------------------------------------------------------

export interface UserAuthStatus {
  authenticated: boolean;
  connectionId?: string;
  connectionName?: string;
  authType?: string;
  expiresAt?: string | null;
}

export async function fetchUserAuthStatus(serverId: string): Promise<UserAuthStatus> {
  const res: ApiResponse<UserAuthStatus> = await mcpApiClient.get(
    `/mcp/user/servers/${serverId}/auth`,
  );
  return unwrap(res);
}

// ---------------------------------------------------------------------------
// Admin test connection
// ---------------------------------------------------------------------------

export interface AdminTestConnectionPayload {
  credentials?: Record<string, unknown>;
  connectionName?: string;
}

export interface AdminTestConnectionResponse {
  success: boolean;
  message?: string;
  statusCode?: number;
  toolCount?: number;
  connectionId?: string;
}

export async function testAdminConnection(
  serverId: string,
  payload: AdminTestConnectionPayload,
): Promise<AdminTestConnectionResponse> {
  const res: ApiResponse<AdminTestConnectionResponse> = await mcpApiClient.post(
    `/mcp/admin/servers/${serverId}/test-connection`,
    payload,
  );
  return unwrap(res);
}

// ---------------------------------------------------------------------------
// Fetch server info + connection status by serverCodes (batch)
// GET /mcp/user/connections/servers/by-codes?serverCodes=code1,code2
// ---------------------------------------------------------------------------

export interface ServerByCode {
  serverId: number | string;
  serverCode: string;
  serverName?: string;
  serverDescription?: string;
  icon?: string;
  runtimeMode?: string;
  supportsStreaming?: boolean;
  categories?: string[];
  connectionId?: number | string;
  connectionName?: string;
  authType?: string;
  connectionStatus?: 'ACTIVE' | 'DISABLED' | 'PENDING';
  isTest?: boolean;
  connectedAt?: string;
  connectionUpdatedAt?: string;
}

export async function fetchServersByCode(serverCodes: string[]): Promise<ServerByCode[]> {
  const res: ApiResponse<ServerByCode[]> = await mcpApiClient.post(
    '/mcp/user/connections/servers/by-codes',
     serverCodes,
  );
  return unwrap(res);
}
