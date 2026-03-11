import { create } from 'zustand';
import dayjs from 'dayjs';
import type { Quota } from '@/schemas/tokenQuotaSchema';

interface TokenQuotaState {
  activeTab: 'usage' | 'quotas' | 'rateLimits';
  setActiveTab: (tab: 'usage' | 'quotas' | 'rateLimits') => void;

  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;

  quotaFormOpen: boolean;
  setQuotaFormOpen: (open: boolean) => void;

  editingQuota: Quota | null;
  setEditingQuota: (quota: Quota | null) => void;

  rateLimitFormOpen: boolean;
  setRateLimitFormOpen: (open: boolean) => void;
}

export const useTokenQuotaStore = create<TokenQuotaState>((set) => ({
  activeTab: 'usage',
  setActiveTab: (activeTab) => set({ activeTab }),

  dateRange: {
    start: dayjs().startOf('month').format('YYYY-MM-DD'),
    end: dayjs().format('YYYY-MM-DD'),
  },
  setDateRange: (dateRange) => set({ dateRange }),

  quotaFormOpen: false,
  setQuotaFormOpen: (quotaFormOpen) => set((s) => ({
    quotaFormOpen,
    editingQuota: quotaFormOpen ? s.editingQuota : null,
  })),

  editingQuota: null,
  setEditingQuota: (editingQuota) => set({ editingQuota }),

  rateLimitFormOpen: false,
  setRateLimitFormOpen: (rateLimitFormOpen) => set({ rateLimitFormOpen }),
}));
