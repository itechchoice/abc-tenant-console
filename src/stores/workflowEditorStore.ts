import { create } from 'zustand';

interface WorkflowEditorState {
  // Code editor panel
  codeEditorOpen: boolean;
  toggleCodeEditor: () => void;
  setCodeEditorOpen: (open: boolean) => void;

  // Tools sidebar
  toolsSidebarOpen: boolean;
  toggleToolsSidebar: () => void;
  setToolsSidebarOpen: (open: boolean) => void;

  // Run drawer
  runDrawerOpen: boolean;
  openRunDrawer: () => void;
  closeRunDrawer: () => void;

  // Edit info dialog
  editInfoDialogOpen: boolean;
  openEditInfoDialog: () => void;
  closeEditInfoDialog: () => void;

  // Dirty tracking
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;

  // Currently editing workflow id
  currentWorkflowId: string | null;
  setCurrentWorkflowId: (id: string | null) => void;

  // Reset
  resetEditor: () => void;
}

export const useWorkflowEditorLocalStore = create<WorkflowEditorState>((set) => ({
  codeEditorOpen: false,
  toggleCodeEditor: () => set((s) => ({ codeEditorOpen: !s.codeEditorOpen })),
  setCodeEditorOpen: (open) => set({ codeEditorOpen: open }),

  toolsSidebarOpen: true,
  toggleToolsSidebar: () => set((s) => ({ toolsSidebarOpen: !s.toolsSidebarOpen })),
  setToolsSidebarOpen: (open) => set({ toolsSidebarOpen: open }),

  runDrawerOpen: false,
  openRunDrawer: () => set({ runDrawerOpen: true }),
  closeRunDrawer: () => set({ runDrawerOpen: false }),

  editInfoDialogOpen: false,
  openEditInfoDialog: () => set({ editInfoDialogOpen: true }),
  closeEditInfoDialog: () => set({ editInfoDialogOpen: false }),

  isDirty: false,
  setDirty: (dirty) => set((state) => (state.isDirty === dirty ? state : { isDirty: dirty })),

  currentWorkflowId: null,
  setCurrentWorkflowId: (id) => set({ currentWorkflowId: id }),

  resetEditor: () => set({
    codeEditorOpen: false,
    toolsSidebarOpen: true,
    runDrawerOpen: false,
    editInfoDialogOpen: false,
    isDirty: false,
    currentWorkflowId: null,
  }),
}));
