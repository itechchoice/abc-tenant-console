import { useMutation } from '@tanstack/react-query';
import { login, type LoginCredentials, type LoginData } from '@/http/authApi';
import { useAuthStore } from '@/stores/authStore';

export function useLogin() {
  const setLoginData = useAuthStore((s) => s.setLoginData);

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: (data: LoginData) => {
      setLoginData(data.token, {
        id: data.id,
        username: data.username,
        tenantId: data.tenantId,
      });
    },
  });
}
