import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

// 创建全局 Axios 单例
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
});

// 请求拦截器：自动注入 Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    // 跨文件无缝读取 Zustand 状态
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器：全局错误处理与 401 登出
apiClient.interceptors.response.use(
  (response) =>
    // 假设你们后端的统一返回结构是 { code, data, message }
    // 这里可以直接剥离外层，返回具体数据
    response.data,
  (error) => {
    // 拦截 401 未授权错误
    if (error.response?.status === 401) {
      // 强制清除本地状态并踢回登录页
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }

    // 你也可以在这里加入全局的 Toast 错误提示逻辑
    // console.error(error.response?.data?.message || '请求失败');

    return Promise.reject(error);
  },
);
