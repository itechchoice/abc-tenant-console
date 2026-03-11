import { create } from 'zustand';

interface FormDialogState {
  open: boolean;
  mode: 'create' | 'edit';
  serverId?: string;
}

interface DetailModalState {
  open: boolean;
  serverId?: string;
}

interface McpManagerState {
  // Filters
  selectedCategoryCode: string;
  searchValue: string;
  setSelectedCategoryCode: (code: string) => void;
  setSearchValue: (value: string) => void;

  // Pagination
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Detail modal
  detailModal: DetailModalState;
  openDetailModal: (serverId: string) => void;
  closeDetailModal: () => void;

  // Create / edit form dialog
  formDialog: FormDialogState;
  openCreateDialog: () => void;
  openEditDialog: (serverId: string) => void;
  closeFormDialog: () => void;

  // Category management sheet
  categorySheetOpen: boolean;
  openCategorySheet: () => void;
  closeCategorySheet: () => void;

  // In-progress operations
  updatingMcpIds: Set<string>;
  addUpdatingMcp: (id: string) => void;
  removeUpdatingMcp: (id: string) => void;

  // Reset
  resetFilters: () => void;
}

export const useMcpManagerStore = create<McpManagerState>((set) => ({
  selectedCategoryCode: '',
  searchValue: '',
  setSelectedCategoryCode: (code) => set({ selectedCategoryCode: code, page: 0 }),
  setSearchValue: (value) => set({ searchValue: value, page: 0 }),

  page: 0,
  pageSize: 9,
  setPage: (page) => set({ page }),
  setPageSize: (size) => set({ pageSize: size, page: 0 }),

  detailModal: { open: false },
  openDetailModal: (serverId) => set({ detailModal: { open: true, serverId } }),
  closeDetailModal: () => set({ detailModal: { open: false } }),

  formDialog: { open: false, mode: 'create' },
  openCreateDialog: () => set({ formDialog: { open: true, mode: 'create' } }),
  openEditDialog: (serverId) => set({ formDialog: { open: true, mode: 'edit', serverId } }),
  closeFormDialog: () => set({ formDialog: { open: false, mode: 'create' } }),

  categorySheetOpen: false,
  openCategorySheet: () => set({ categorySheetOpen: true }),
  closeCategorySheet: () => set({ categorySheetOpen: false }),

  updatingMcpIds: new Set(),
  addUpdatingMcp: (id) => set((s) => {
    const next = new Set(s.updatingMcpIds);
    next.add(id);
    return { updatingMcpIds: next };
  }),
  removeUpdatingMcp: (id) => set((s) => {
    const next = new Set(s.updatingMcpIds);
    next.delete(id);
    return { updatingMcpIds: next };
  }),

  resetFilters: () => set({ selectedCategoryCode: '', searchValue: '', page: 0 }),
}));
