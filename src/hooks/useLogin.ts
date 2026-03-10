import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/http/client';
import { useAuthStore } from '@/stores/authStore';

interface LoginCredentials {
  tenantId: string;
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  [key: string]: unknown;
}

export function useLogin() {
  const setLoginData = useAuthStore((s) => s.setLoginData);

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await apiClient.post('/auth/login', credentials) as { code: number; message?: string; data: LoginResponse };
      if (res.code !== 0) {
        throw new Error(res.message || 'Login failed');
      }
      return res.data;
    },
    onSuccess: (data) => {
      const { token, ...userInfo } = data;
      setLoginData(token, userInfo as { id: string; username: string; tenantId?: string });
    },
  });
}
