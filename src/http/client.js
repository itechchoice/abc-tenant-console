import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const loginPath = new URL('login', window.location.origin + import.meta.env.BASE_URL).pathname;

// 创建全局 Axios 单例
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/tenant-console-api',
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
  // 假设后端统一返回结构是 { code, data, message }，直接剥离外层返回具体数据
  (response) => response.data,
  (error) => {
    // 拦截 401 未授权错误
    if (error.response?.status === 401) {
      // 强制清除本地状态并踢回登录页
      useAuthStore.getState().logout();
      window.location.href = loginPath;
    }

    // 你也可以在这里加入全局的 Toast 错误提示逻辑
    // console.error(error.response?.data?.message || '请求失败');

    return Promise.reject(error);
  },
);
