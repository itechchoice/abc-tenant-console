import { create } from 'zustand';
import type { Message } from '@/schemas/chatSchema';
import type { AssignedProvider } from '@/schemas/modelSchema';

interface ChatState {
  messages: Message[];
  isTyping: boolean;
  currentSessionId: string | null;
  currentWorkflowId: string | null;
  activeNodeId: string | null;
  activeTaskId: string | null;
  activeStepName: string | null;
  workflowStatus: 'idle' | 'running' | 'completed';
  hasMore: boolean;
  isLoadingMore: boolean;
  isHistoricalTrack: boolean;
  selectedModel: AssignedProvider | null;
  chatMode: 'auto' | 'agent' | 'model';
  selectedAgentId: string | null;
}

interface ChatActions {
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, patch: Partial<Message>) => void;
  setTyping: (typing: boolean) => void;
  setCurrentSessionId: (sessionId: string | null) => void;
  setWorkflowInfo: (workflowId: string | null, nodeId: string | null) => void;
  setWorkflowState: (patch: {
    activeTaskId?: string | null;
    activeStepName?: string | null;
    workflowStatus?: 'idle' | 'running' | 'completed';
  }) => void;
  setHasMore: (flag: boolean) => void;
  setIsLoadingMore: (flag: boolean) => void;
  prependMessages: (olderMessages: Message[]) => void;
  setHistoricalTrack: (flag: boolean) => void;
  setSelectedModel: (model: AssignedProvider | null) => void;
  setChatMode: (mode: 'auto' | 'agent' | 'model') => void;
  setSelectedAgentId: (id: string | null) => void;
  clearChat: () => void;
}

type ChatStore = ChatState & ChatActions;

const INITIAL_STATE: Omit<ChatState, 'selectedModel' | 'chatMode' | 'selectedAgentId'> = {
  messages: [],
  isTyping: false,
  currentSessionId: null,
  currentWorkflowId: null,
  activeNodeId: null,
  activeTaskId: null,
  activeStepName: null,
  workflowStatus: 'idle',
  hasMore: false,
  isLoadingMore: false,
  isHistoricalTrack: false,
};

export const useChatStore = create<ChatStore>((set) => ({
  ...INITIAL_STATE,
  selectedModel: null,
  chatMode: 'auto',
  selectedAgentId: null,

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),

  updateMessage: (id, patch) => set((state) => ({
    messages: state.messages.map((msg) => (msg.id === id ? { ...msg, ...patch } : msg)),
  })),

  setTyping: (typing) => set({ isTyping: typing }),

  setCurrentSessionId: (sessionId) => set({ currentSessionId: sessionId }),

  setWorkflowInfo: (workflowId, nodeId) => set({
    currentWorkflowId: workflowId,
    activeNodeId: nodeId,
  }),

  setWorkflowState: (patch) => set((state) => ({
    activeTaskId: patch.activeTaskId !== undefined ? patch.activeTaskId : state.activeTaskId,
    activeStepName: patch.activeStepName !== undefined ? patch.activeStepName : state.activeStepName,
    workflowStatus: patch.workflowStatus !== undefined ? patch.workflowStatus : state.workflowStatus,
  })),

  setHasMore: (flag) => set({ hasMore: flag }),

  setIsLoadingMore: (flag) => set({ isLoadingMore: flag }),

  prependMessages: (olderMessages) => set((state) => ({
    messages: [...olderMessages, ...state.messages],
  })),

  setHistoricalTrack: (flag) => set({ isHistoricalTrack: flag }),

  setSelectedModel: (model) => set({ selectedModel: model }),

  setChatMode: (mode) => set({ chatMode: mode }),

  setSelectedAgentId: (id) => set({ selectedAgentId: id }),

  clearChat: () => set(INITIAL_STATE),
}));
