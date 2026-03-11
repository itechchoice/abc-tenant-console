import { create } from 'zustand';

export type AiActiveView = 'current' | 'ai';

export interface GenerationStep {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface AiViewState {
  isOpen: boolean;
  generating: boolean;
  activeView: AiActiveView;
  currentSnapshot: Record<string, unknown> | null;
  aiWorkflow: Record<string, unknown> | null;
  showToggle: boolean;
  generationSteps: GenerationStep[];
  lastPrompt: string;
  abortController: AbortController | null;
}

interface AiViewActions {
  open: () => void;
  close: () => void;
  startGeneration: (prompt: string) => AbortController;
  setSteps: (steps: GenerationStep[]) => void;
  updateStep: (stepId: string, status: GenerationStep['status']) => void;
  finishGeneration: (workflow: Record<string, unknown>) => void;
  failGeneration: (error?: string) => void;
  setCurrentSnapshot: (snapshot: Record<string, unknown>) => void;
  setActiveView: (view: AiActiveView) => void;
  apply: () => void;
  discard: () => Record<string, unknown> | null;
  reset: () => void;
}

export type AiViewStore = AiViewState & AiViewActions;

const initialState: AiViewState = {
  isOpen: false,
  generating: false,
  activeView: 'current',
  currentSnapshot: null,
  aiWorkflow: null,
  showToggle: false,
  generationSteps: [],
  lastPrompt: '',
  abortController: null,
};

export const useAiViewStore = create<AiViewStore>((set, get) => ({
  ...initialState,

  open: () => set({ isOpen: true }),
  close: () => {
    const { abortController } = get();
    abortController?.abort();
    set(initialState);
  },

  startGeneration: (prompt: string) => {
    const { abortController: prev } = get();
    prev?.abort();
    const controller = new AbortController();
    set({
      generating: true,
      lastPrompt: prompt,
      abortController: controller,
      generationSteps: [],
      aiWorkflow: null,
      activeView: 'current',
      showToggle: false,
    });
    return controller;
  },

  setSteps: (steps) => set({ generationSteps: steps }),

  updateStep: (stepId, status) => set((state) => ({
    generationSteps: state.generationSteps.map((s) =>
      s.id === stepId ? { ...s, status } : s,
    ),
  })),

  finishGeneration: (workflow) => set({
    generating: false,
    aiWorkflow: workflow,
    activeView: 'ai',
    showToggle: true,
    abortController: null,
  }),

  failGeneration: () => set({
    generating: false,
    abortController: null,
  }),

  setCurrentSnapshot: (snapshot) => set({ currentSnapshot: snapshot }),

  setActiveView: (view) => set({ activeView: view }),

  apply: () => set({
    activeView: 'current',
    showToggle: false,
    currentSnapshot: null,
    aiWorkflow: null,
  }),

  discard: () => {
    const { currentSnapshot } = get();
    set({
      activeView: 'current',
      showToggle: false,
      aiWorkflow: null,
    });
    return currentSnapshot;
  },

  reset: () => {
    const { abortController } = get();
    abortController?.abort();
    set(initialState);
  },
}));
