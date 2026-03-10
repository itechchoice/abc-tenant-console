import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserInfo {
  id: string;
  username: string;
  tenantId?: string;
  [key: string]: unknown;
}

interface AuthState {
  token: string | null;
  userInfo: UserInfo | null;
}

interface AuthActions {
  setLoginData: (token: string, userInfo: UserInfo) => void;
  logout: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      userInfo: null,

      setLoginData: (token, userInfo) => set({ token, userInfo }),

      logout: () => set({ token: null, userInfo: null }),
    }),
    {
      name: 'tenant-auth-storage',
    },
  ),
);
