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
<<<<<<< Updated upstream
  const res: ApiResponse<LoginData> = await authApiClient.post('/auth/login', credentials);
=======
  const res: ApiResponse<LoginData> = await apiClient.post('/auth-server/auth/login', credentials);
>>>>>>> Stashed changes
  return unwrap(res);
}
