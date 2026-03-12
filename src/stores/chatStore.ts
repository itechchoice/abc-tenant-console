import { create } from 'zustand';
import type { Message } from '@/schemas/chatSchema';
import type { ChatModel } from '@/http/modelManagerApi';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PENDING_SESSION_ID = '__pending__';

const EMPTY_MESSAGES: Message[] = [];

// ---------------------------------------------------------------------------
// Session-scoped state
// ---------------------------------------------------------------------------

export interface NodeExecState {
  status: string;
  success?: boolean;
  nodeType?: string;
  reason?: string;
  startTimestamp?: string;
  endTimestamp?: string;
  payload?: Record<string, unknown>;
}

export interface StepEvent {
  id: string;
  eventType: string;
  timestamp: string;
  endTimestamp?: string;
  nodeId?: string;
  nodeType?: string;
  status?: string;
  streamedContent: string;
  payload: Record<string, unknown>;
  error?: string;
  reason?: string;
}

export interface WorkflowExecution {
  workflowId: string;
  nodeStates: Record<string, NodeExecState>;
  executionStatus: 'running' | 'completed' | 'failed';
  stepEvents: StepEvent[];
}

export interface SessionState {
  messages: Map<string, Message>;
  messageOrder: string[];
  hasMore: boolean;
  isLoadingMore: boolean;
  isTyping: boolean;
  workflowExecutions: Map<string, WorkflowExecution>;
}

function createEmptySession(): SessionState {
  return {
    messages: new Map(),
    messageOrder: [],
    hasMore: false,
    isLoadingMore: false,
    isTyping: false,
    workflowExecutions: new Map(),
  };
}

// ---------------------------------------------------------------------------
// Top-level store
// ---------------------------------------------------------------------------

interface ChatState {
  sessions: Map<string, SessionState>;
  currentSessionId: string | null;
  selectedModel: ChatModel | null;
  chatMode: 'model';
  isHistoricalTrack: boolean;
}

interface ChatActions {
  switchSession: (sessionId: string | null) => void;
  ensureSession: (sessionId: string) => SessionState;
  clearSession: (sessionId: string) => void;
  migrateSession: (from: string, to: string) => void;

  addMessage: (sessionId: string, msg: Message) => void;
  updateMessage: (sessionId: string, msgId: string, patch: Partial<Message>) => void;
  setSessionMessages: (sessionId: string, msgs: Message[]) => void;
  prependMessages: (sessionId: string, older: Message[]) => void;
  getMessage: (sessionId: string, msgId: string) => Message | undefined;

  setTyping: (sessionId: string, typing: boolean) => void;
  setHasMore: (sessionId: string, flag: boolean) => void;
  setIsLoadingMore: (sessionId: string, flag: boolean) => void;

  setHistoricalTrack: (flag: boolean) => void;
  setSelectedModel: (model: ChatModel | null) => void;

  startWorkflowExecution: (sessionId: string, workflowId: string) => void;
  updateNodeState: (sessionId: string, workflowId: string, nodeId: string, patch: Partial<NodeExecState>) => void;
  finishWorkflowExecution: (sessionId: string, workflowId: string, status: 'completed' | 'failed') => void;
  appendStepEvent: (sessionId: string, workflowId: string, event: StepEvent) => void;
  getWorkflowExecution: (sessionId: string, workflowId: string) => WorkflowExecution | undefined;
}

type ChatStore = ChatState & ChatActions;

// ---------------------------------------------------------------------------
// Internal helper — produces a new `sessions` Map with one session updated
// ---------------------------------------------------------------------------

function patchSession(
  sessions: Map<string, SessionState>,
  sessionId: string,
  updater: (session: SessionState) => SessionState,
): Map<string, SessionState> {
  const session = sessions.get(sessionId);
  if (!session) return sessions;
  const updated = updater(session);
  if (updated === session) return sessions;
  const next = new Map(sessions);
  next.set(sessionId, updated);
  return next;
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export function selectActiveSessionId(s: ChatState): string {
  return s.currentSessionId ?? PENDING_SESSION_ID;
}

export function selectCurrentSession(s: ChatState): SessionState | undefined {
  return s.sessions.get(selectActiveSessionId(s));
}

/**
 * Returns a referentially-stable array of messages for the active session.
 * The array reference only changes when the underlying `messages` Map or
 * `messageOrder` array is replaced — which prevents Zustand's
 * `useSyncExternalStore` from triggering infinite re-render loops.
 */
let _cachedList: Message[] = EMPTY_MESSAGES;
let _cachedMap: Map<string, Message> | null = null;
let _cachedOrder: string[] | null = null;

export function selectCurrentMessages(s: ChatState): Message[] {
  const session = selectCurrentSession(s);
  if (!session || session.messageOrder.length === 0) return EMPTY_MESSAGES;

  if (session.messages === _cachedMap && session.messageOrder === _cachedOrder) {
    return _cachedList;
  }

  _cachedMap = session.messages;
  _cachedOrder = session.messageOrder;
  _cachedList = session.messageOrder
    .map((id) => session.messages.get(id))
    .filter((m): m is Message => m !== undefined);
  return _cachedList;
}

export function selectIsTyping(s: ChatState): boolean {
  return selectCurrentSession(s)?.isTyping ?? false;
}

export function selectHasMore(s: ChatState): boolean {
  return selectCurrentSession(s)?.hasMore ?? false;
}

export function selectIsLoadingMore(s: ChatState): boolean {
  return selectCurrentSession(s)?.isLoadingMore ?? false;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: new Map(),
  currentSessionId: null,
  selectedModel: null,
  chatMode: 'model',
  isHistoricalTrack: false,

  switchSession: (sessionId) => set({
    currentSessionId: sessionId,
    isHistoricalTrack: false,
  }),

  ensureSession: (sessionId) => {
    const existing = get().sessions.get(sessionId);
    if (existing) return existing;
    const fresh = createEmptySession();
    const next = new Map(get().sessions);
    next.set(sessionId, fresh);
    set({ sessions: next });
    return fresh;
  },

  clearSession: (sessionId) => set((state) => {
    if (!state.sessions.has(sessionId)) return state;
    const next = new Map(state.sessions);
    next.delete(sessionId);
    return {
      sessions: next,
      ...(state.currentSessionId === sessionId ? { currentSessionId: null } : {}),
    };
  }),

  migrateSession: (from, to) => set((state) => {
    const session = state.sessions.get(from);
    if (!session) return state;
    const next = new Map(state.sessions);
    next.delete(from);
    next.set(to, session);
    return {
      sessions: next,
      currentSessionId: state.currentSessionId === from ? to : state.currentSessionId,
    };
  }),

  addMessage: (sessionId, msg) => set((state) => {
    const session = state.sessions.get(sessionId) ?? createEmptySession();
    const newMessages = new Map(session.messages);
    newMessages.set(msg.id, msg);
    const newOrder = session.messageOrder.includes(msg.id)
      ? session.messageOrder
      : [...session.messageOrder, msg.id];
    const next = new Map(state.sessions);
    next.set(sessionId, { ...session, messages: newMessages, messageOrder: newOrder });
    return { sessions: next };
  }),

  updateMessage: (sessionId, msgId, patch) => set((state) => {
    const session = state.sessions.get(sessionId);
    if (!session) return state;
    const old = session.messages.get(msgId);
    if (!old) return state;
    const newMessages = new Map(session.messages);
    newMessages.set(msgId, { ...old, ...patch });
    const next = new Map(state.sessions);
    next.set(sessionId, { ...session, messages: newMessages });
    return { sessions: next };
  }),

  getMessage: (sessionId, msgId) => {
    const session = get().sessions.get(sessionId);
    return session?.messages.get(msgId);
  },

  setSessionMessages: (sessionId, msgs) => set((state) => {
    const session = state.sessions.get(sessionId) ?? createEmptySession();
    const newMessages = new Map<string, Message>();
    const newOrder: string[] = [];
    for (const m of msgs) {
      newMessages.set(m.id, m);
      newOrder.push(m.id);
    }
    const next = new Map(state.sessions);
    next.set(sessionId, { ...session, messages: newMessages, messageOrder: newOrder });
    return { sessions: next };
  }),

  prependMessages: (sessionId, older) => set((state) => {
    const sessions = patchSession(state.sessions, sessionId, (session) => {
      const newMessages = new Map(session.messages);
      const prependIds: string[] = [];
      for (const m of older) {
        if (!newMessages.has(m.id)) {
          newMessages.set(m.id, m);
          prependIds.push(m.id);
        }
      }
      if (prependIds.length === 0) return session;
      return {
        ...session,
        messages: newMessages,
        messageOrder: [...prependIds, ...session.messageOrder],
      };
    });
    return { sessions };
  }),

  setTyping: (sessionId, typing) => set((state) => ({
    sessions: patchSession(state.sessions, sessionId, (s) =>
      (s.isTyping === typing ? s : { ...s, isTyping: typing })),
  })),

  setHasMore: (sessionId, flag) => set((state) => ({
    sessions: patchSession(state.sessions, sessionId, (s) =>
      (s.hasMore === flag ? s : { ...s, hasMore: flag })),
  })),

  setIsLoadingMore: (sessionId, flag) => set((state) => ({
    sessions: patchSession(state.sessions, sessionId, (s) =>
      (s.isLoadingMore === flag ? s : { ...s, isLoadingMore: flag })),
  })),

  setHistoricalTrack: (flag) => set({ isHistoricalTrack: flag }),
  setSelectedModel: (model) => set({ selectedModel: model }),

  startWorkflowExecution: (sessionId, workflowId) => set((state) => {
    const session = state.sessions.get(sessionId);
    if (!session) return state;
    const newExecs = new Map(session.workflowExecutions);
    newExecs.set(workflowId, {
      workflowId,
      nodeStates: {},
      executionStatus: 'running',
      stepEvents: [],
    });
    const next = new Map(state.sessions);
    next.set(sessionId, { ...session, workflowExecutions: newExecs });
    return { sessions: next };
  }),

  updateNodeState: (sessionId, workflowId, nodeId, patch) => set((state) => {
    const session = state.sessions.get(sessionId);
    if (!session) return state;
    const exec = session.workflowExecutions.get(workflowId);
    if (!exec) return state;

    const existing = exec.nodeStates[nodeId];
    const merged = { ...existing, ...patch };

    if (merged.success === undefined && merged.status) {
      const terminalSuccess = ['completed', 'success'].includes(merged.status);
      const terminalFail = ['failed', 'error'].includes(merged.status);
      if (terminalSuccess) merged.success = true;
      else if (terminalFail) merged.success = false;
    }

    const newExecs = new Map(session.workflowExecutions);
    newExecs.set(workflowId, {
      ...exec,
      nodeStates: { ...exec.nodeStates, [nodeId]: merged },
    });
    const next = new Map(state.sessions);
    next.set(sessionId, { ...session, workflowExecutions: newExecs });
    return { sessions: next };
  }),

  finishWorkflowExecution: (sessionId, workflowId, status) => set((state) => {
    const session = state.sessions.get(sessionId);
    if (!session) return state;
    const exec = session.workflowExecutions.get(workflowId);
    if (!exec) return state;
    const newExecs = new Map(session.workflowExecutions);
    newExecs.set(workflowId, { ...exec, executionStatus: status });
    const next = new Map(state.sessions);
    next.set(sessionId, { ...session, workflowExecutions: newExecs });
    return { sessions: next };
  }),

  appendStepEvent: (sessionId, workflowId, event) => set((state) => {
    const session = state.sessions.get(sessionId);
    if (!session) return state;
    const exec = session.workflowExecutions.get(workflowId);
    if (!exec) return state;
    const newExecs = new Map(session.workflowExecutions);
    newExecs.set(workflowId, {
      ...exec,
      stepEvents: [...exec.stepEvents, event],
    });
    const next = new Map(state.sessions);
    next.set(sessionId, { ...session, workflowExecutions: newExecs });
    return { sessions: next };
  }),

  getWorkflowExecution: (sessionId, workflowId) => {
    const session = get().sessions.get(sessionId);
    return session?.workflowExecutions.get(workflowId);
  },
}));
