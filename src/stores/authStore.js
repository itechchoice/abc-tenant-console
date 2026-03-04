import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      userInfo: null,

      // 登录成功后调用此方法保存状态
      setLoginData: (token, userInfo) => set({ token, userInfo }),

      // 登出或 401 时调用此方法清理状态
      logout: () => set({ token: null, userInfo: null }),
    }),
    {
      name: 'tenant-auth-storage', // 持久化到 localStorage 中的 key
    },
  ),
);
