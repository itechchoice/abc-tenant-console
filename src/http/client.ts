import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const loginPath = new URL('login', window.location.origin + import.meta.env.BASE_URL).pathname;

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/tenant-console-api',
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = loginPath;
    }
    return Promise.reject(error);
  },
);
