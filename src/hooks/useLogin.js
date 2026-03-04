import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/http/client';
import { useAuthStore } from '@/stores/authStore';

export function useLogin() {
  const setLoginData = useAuthStore((s) => s.setLoginData);

  return useMutation({
    mutationFn: async (credentials) => {
      const res = await apiClient.post('/auth/login', credentials);
      if (res.code !== 0) {
        throw new Error(res.message || '登录失败');
      }
      return res.data;
    },
    onSuccess: (data) => {
      const { token, ...userInfo } = data;
      setLoginData(token, userInfo);
    },
  });
}
