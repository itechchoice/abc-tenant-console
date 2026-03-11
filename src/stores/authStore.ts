import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authConfig } from '@/config/auth';

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

function getInitialAuthState(): AuthState {
  if (authConfig.devBypassEnabled) {
    return {
      token: authConfig.mockSession.token,
      userInfo: authConfig.mockSession.userInfo,
    };
  }

  return {
    token: null,
    userInfo: null,
  };
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...getInitialAuthState(),

      setLoginData: (token, userInfo) => set({ token, userInfo }),

      logout: () => set({ token: null, userInfo: null }),
    }),
    {
      name: 'tenant-auth-storage',
      merge: (persistedState, currentState) => {
        const merged = {
          ...currentState,
          ...(persistedState as Partial<AuthStore> | undefined),
        };

        if (authConfig.devBypassEnabled && !merged.token) {
          return {
            ...merged,
            token: authConfig.mockSession.token,
            userInfo: authConfig.mockSession.userInfo,
          };
        }

        return merged;
      },
    },
  ),
);

export function ensureDevAuthSession() {
  if (!authConfig.devBypassEnabled) {
    return;
  }

  const { token } = useAuthStore.getState();

  if (token) {
    return;
  }

  useAuthStore.setState({
    token: authConfig.mockSession.token,
    userInfo: authConfig.mockSession.userInfo,
  });
}
