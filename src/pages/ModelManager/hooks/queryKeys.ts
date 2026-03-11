export const modelManagerKeys = {
  providers: {
    all: ['providers'] as const,
    lists: () => [...modelManagerKeys.providers.all, 'list'] as const,
    list: (f: Record<string, unknown>) => [...modelManagerKeys.providers.lists(), f] as const,
    details: () => [...modelManagerKeys.providers.all, 'detail'] as const,
    detail: (id: string) => [...modelManagerKeys.providers.details(), id] as const,
  },
  models: {
    all: ['models'] as const,
    byProvider: (pid: string) => [...modelManagerKeys.models.all, 'byProvider', pid] as const,
    allList: (f?: Record<string, unknown>) => [...modelManagerKeys.models.all, 'allList', f] as const,
    detail: (id: string) => [...modelManagerKeys.models.all, 'detail', id] as const,
  },
  pools: {
    all: ['pools'] as const,
    list: () => [...modelManagerKeys.pools.all, 'list'] as const,
    detail: (id: string) => [...modelManagerKeys.pools.all, 'detail', id] as const,
    members: (poolId: string) => [...modelManagerKeys.pools.all, 'members', poolId] as const,
  },
};
