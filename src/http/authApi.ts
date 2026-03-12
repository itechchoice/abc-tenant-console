import { authApiClient, type ApiResponse, unwrap } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginData {
  token: string;
  id: string;
  username: string;
  tenantId?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function login(credentials: LoginCredentials): Promise<LoginData> {
  const res: ApiResponse<LoginData> = await authApiClient.post('/auth/login', credentials);
  return unwrap(res);
}
