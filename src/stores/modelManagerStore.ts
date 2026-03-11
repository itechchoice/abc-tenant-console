import { create } from 'zustand';

type ActiveTab = 'providers' | 'pools';

interface FormDialogState {
  open: boolean;
  mode: 'create' | 'edit';
  id?: string;
  parentId?: string; // providerId for model creation
}

interface SheetState {
  open: boolean;
  id?: string;
}

interface ModelManagerState {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Provider
  providerSearch: string;
  providerTypeFilter: string;
  providerPage: number;
  setProviderSearch: (v: string) => void;
  setProviderTypeFilter: (v: string) => void;
  setProviderPage: (p: number) => void;

  providerFormDialog: FormDialogState;
  openCreateProvider: () => void;
  openEditProvider: (id: string) => void;
  closeProviderForm: () => void;

  providerDetailSheet: SheetState;
  openProviderDetail: (id: string) => void;
  closeProviderDetail: () => void;

  // Model (under provider)
  modelFormDialog: FormDialogState;
  openCreateModel: (providerId: string) => void;
  openEditModel: (modelId: string, providerId: string) => void;
  closeModelForm: () => void;

  // Pool
  poolSearch: string;
  poolPage: number;
  setPoolSearch: (v: string) => void;
  setPoolPage: (p: number) => void;

  poolFormDialog: FormDialogState;
  openCreatePool: () => void;
  openEditPool: (id: string) => void;
  closePoolForm: () => void;

  poolDetailSheet: SheetState;
  openPoolDetail: (id: string) => void;
  closePoolDetail: () => void;

  addMemberDialog: { open: boolean; poolId?: string };
  openAddMember: (poolId: string) => void;
  closeAddMember: () => void;

  // Shared
  updatingIds: Set<string>;
  addUpdating: (id: string) => void;
  removeUpdating: (id: string) => void;
}

export const useModelManagerStore = create<ModelManagerState>((set) => ({
  activeTab: 'providers',
  setActiveTab: (tab) => set({ activeTab: tab }),

  providerSearch: '',
  providerTypeFilter: '',
  providerPage: 0,
  setProviderSearch: (v) => set({ providerSearch: v, providerPage: 0 }),
  setProviderTypeFilter: (v) => set({ providerTypeFilter: v, providerPage: 0 }),
  setProviderPage: (p) => set({ providerPage: p }),

  providerFormDialog: { open: false, mode: 'create' },
  openCreateProvider: () => set({ providerFormDialog: { open: true, mode: 'create' } }),
  openEditProvider: (id) => set({ providerFormDialog: { open: true, mode: 'edit', id } }),
  closeProviderForm: () => set({ providerFormDialog: { open: false, mode: 'create' } }),

  providerDetailSheet: { open: false },
  openProviderDetail: (id) => set({ providerDetailSheet: { open: true, id } }),
  closeProviderDetail: () => set({ providerDetailSheet: { open: false } }),

  modelFormDialog: { open: false, mode: 'create' },
  openCreateModel: (providerId) => set({ modelFormDialog: { open: true, mode: 'create', parentId: providerId } }),
  openEditModel: (modelId, providerId) => set({ modelFormDialog: { open: true, mode: 'edit', id: modelId, parentId: providerId } }),
  closeModelForm: () => set({ modelFormDialog: { open: false, mode: 'create' } }),

  poolSearch: '',
  poolPage: 0,
  setPoolSearch: (v) => set({ poolSearch: v, poolPage: 0 }),
  setPoolPage: (p) => set({ poolPage: p }),

  poolFormDialog: { open: false, mode: 'create' },
  openCreatePool: () => set({ poolFormDialog: { open: true, mode: 'create' } }),
  openEditPool: (id) => set({ poolFormDialog: { open: true, mode: 'edit', id } }),
  closePoolForm: () => set({ poolFormDialog: { open: false, mode: 'create' } }),

  poolDetailSheet: { open: false },
  openPoolDetail: (id) => set({ poolDetailSheet: { open: true, id } }),
  closePoolDetail: () => set({ poolDetailSheet: { open: false } }),

  addMemberDialog: { open: false },
  openAddMember: (poolId) => set({ addMemberDialog: { open: true, poolId } }),
  closeAddMember: () => set({ addMemberDialog: { open: false } }),

  updatingIds: new Set(),
  addUpdating: (id) => set((s) => { const n = new Set(s.updatingIds); n.add(id); return { updatingIds: n }; }),
  removeUpdating: (id) => set((s) => { const n = new Set(s.updatingIds); n.delete(id); return { updatingIds: n }; }),
}));
