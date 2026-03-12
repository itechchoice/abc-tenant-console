import { apiClient, type ApiResponse, unwrap } from './client';
import type { AuthParamConfig } from '@/schemas/mcpManagerSchema';

// ---------------------------------------------------------------------------
// User-side auth param definitions (only USER-level params are returned)
// ---------------------------------------------------------------------------

export async function fetchUserAuthParams(serverId: string): Promise<AuthParamConfig[]> {
  const res: ApiResponse<AuthParamConfig[]> = await apiClient.get(
    `/mcp-gateway/mcp/user/mcp-servers/${serverId}/auth-params`,
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
  const res: ApiResponse<UserCredentialResponse> = await apiClient.post(
    `/mcp-gateway/mcp/user/servers/${serverId}/auth`,
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
  const res: ApiResponse<UserOAuth2Response> = await apiClient.post(
    `/mcp-gateway/mcp/user/servers/${serverId}/auth`,
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
  const res: ApiResponse<UserAuthStatus> = await apiClient.get(
    `/mcp-gateway/mcp/user/servers/${serverId}/auth`,
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
  const res: ApiResponse<AdminTestConnectionResponse> = await apiClient.post(
    `/mcp-gateway/mcp/admin/servers/${serverId}/test-connection`,
    payload,
  );
  return unwrap(res);
}
