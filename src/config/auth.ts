const devBypassEnabled = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

export const authConfig = {
  devBypassEnabled,
  mockSession: {
    token: 'dev-bypass-token',
    userInfo: {
      id: 'dev-user',
      username: 'dev-user',
      tenantId: 'dev-tenant',
    },
  },
} as const;
