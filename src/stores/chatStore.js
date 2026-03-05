import { create } from 'zustand';

/**
 * @typedef {import('@/schemas/chatSchema').Message} Message
 * @typedef {import('@/schemas/chatSchema').MessageRole} MessageRole
 * @typedef {import('@/schemas/chatSchema').MessageStatus} MessageStatus
 * @typedef {import('@/schemas/chatSchema').ToolCall} ToolCall
 * @typedef {import('@/schemas/modelSchema').AssignedProvider} AssignedProvider
 */

// ---------------------------------------------------------------------------
// Store shape typedefs – provides full IntelliSense in pure-JS consumers.
// ---------------------------------------------------------------------------

/**
 * Reactive state slice managed by the chat store.
 *
 * @typedef {object} ChatState
 * @property {Message[]} messages
 *   Chronologically ordered list of all messages in the active conversation.
 * @property {boolean} isTyping
 *   `true` while the LLM is actively streaming tokens via SSE.
 * @property {string | null} currentSessionId
 *   ID of the active conversation session, or `null` for a fresh chat.
 * @property {string | null} currentWorkflowId
 *   ID of the workflow currently activated by the AI agent, or `null`
 *   when no workflow context is active.
 * @property {string | null} activeNodeId
 *   ID of the workflow node currently highlighted / executing, or `null`.
 * @property {AssignedProvider | null} selectedModel
 *   Currently selected LLM provider for the chat input.  Persists across
 *   `clearChat` calls as a workspace-level preference.
 * @property {'auto' | 'agent' | 'model'} chatMode
 *   Active chat dispatch mode per ENGINE_API `POST /chat`:
 *   - `auto`  – no agentId / modelId, backend auto-routes.
 *   - `agent` – sends `agentId`, full orchestration pipeline.
 *   - `model` – sends `modelId`, direct LLM call.
 * @property {string | null} selectedAgentId
 *   Target agent identifier for `chatMode === 'agent'`.
 */

/**
 * Imperative actions exposed by the chat store.
 *
 * @typedef {object} ChatActions
 * @property {(messages: Message[]) => void} setMessages
 *   Replace the entire message list with a pre-built array.  Used when
 *   loading a persisted conversation from the server (history restore).
 * @property {(message: Message) => void} addMessage
 *   Append a fully-formed message to the end of the conversation.
 * @property {(id: string, patch: Partial<Message>) => void} updateMessage
 *   Immutably merge `patch` into the message identified by `id`.
 *   Commonly used to append streamed token deltas or flip a message's
 *   status from `streaming` → `completed`.
 * @property {(typing: boolean) => void} setTyping
 *   Toggle the global streaming / typing indicator.
 * @property {(sessionId: string | null) => void} setCurrentSessionId
 *   Set or clear the active conversation session.
 * @property {(workflowId: string | null, nodeId: string | null) => void} setWorkflowInfo
 *   Atomically update the active workflow ID **and** the highlighted node
 *   ID in a single render batch.
 * @property {(model: AssignedProvider | null) => void} setSelectedModel
 *   Set or clear the active LLM provider for the chat input.
 * @property {(mode: 'auto' | 'agent' | 'model') => void} setChatMode
 *   Switch the chat dispatch mode.
 * @property {(id: string | null) => void} setSelectedAgentId
 *   Set or clear the target agent for agent mode.
 * @property {() => void} clearChat
 *   Reset conversation-level state to initial values.  `selectedModel`
 *   is deliberately **not** reset (workspace-level preference).
 */

/**
 * Composite store type – union of reactive state + actions.
 *
 * @typedef {ChatState & ChatActions} ChatStore
 */

// ---------------------------------------------------------------------------
// Initial state snapshot – extracted as a constant so `clearChat` can
// deterministically restore the store without risk of stale closures.
// ---------------------------------------------------------------------------

/** @type {ChatState} */
const INITIAL_STATE = {
  messages: [],
  isTyping: false,
  currentSessionId: null,
  currentWorkflowId: null,
  activeNodeId: null,
};

// ---------------------------------------------------------------------------
// Store definition
// ---------------------------------------------------------------------------

/**
 * Global chat store – manages the active conversation, streaming lifecycle,
 * and workflow execution context for the AI agent interface.
 *
 * Usage:
 * ```js
 * import { useChatStore } from '@/stores/chatStore';
 *
 * // Inside a React component
 * const messages = useChatStore((s) => s.messages);
 * const addMessage = useChatStore((s) => s.addMessage);
 * ```
 *
 * @type {import('zustand').UseBoundStore<import('zustand').StoreApi<ChatStore>>}
 */
export const useChatStore = create((set) => ({
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

  setSelectedModel: (model) => set({ selectedModel: model }),

  setChatMode: (mode) => set({ chatMode: mode }),

  setSelectedAgentId: (id) => set({ selectedAgentId: id }),

  clearChat: () => set(INITIAL_STATE),
}));
