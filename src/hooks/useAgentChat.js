import { useRef, useCallback, useEffect } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';

/**
 * @typedef {import('@/schemas/chatSchema').Message} Message
 */

// ---------------------------------------------------------------------------
// JSDoc typedefs – contract for consumers of this Hook.
// ---------------------------------------------------------------------------

/**
 * Optional metadata bag forwarded alongside the user's prompt to the
 * backend `/agent/chat` SSE endpoint.
 *
 * @typedef {object} SendMessageMeta
 * @property {string} [workflowId]
 *   ID of the workflow context the message belongs to.
 * @property {Record<string, unknown>} [extra]
 *   Arbitrary key-value pairs the caller may attach for server-side routing.
 */

/**
 * Public API surface returned by {@link useAgentChat}.
 *
 * @typedef {object} UseAgentChatReturn
 * @property {(content: string, metadata?: SendMessageMeta) => Promise<void>} sendMessage
 *   Initiates a streaming conversation turn.  Automatically creates a `user`
 *   message, a placeholder `assistant` message, and opens an SSE connection
 *   whose events are routed into the global {@link useChatStore}.
 * @property {() => void} stopStream
 *   Immediately aborts the in-flight SSE connection (if any) and resets the
 *   typing indicator.  Safe to call multiple times.
 * @property {boolean} isLoading
 *   Reactive flag derived from `useChatStore.isTyping` – `true` while the
 *   LLM is actively streaming tokens.
 */

// ---------------------------------------------------------------------------
// SSE event payload typedefs – documents the backend contract for each
// custom event so that downstream handlers are self-descriptive.
// ---------------------------------------------------------------------------

/**
 * `message_chunk` — incremental text delta emitted by the LLM during
 * token-by-token streaming.
 *
 * @typedef {object} MessageChunkPayload
 * @property {string} content – Text fragment to append to the assistant turn.
 */

/**
 * `tool_call` — the LLM has decided to delegate work to an external tool.
 *
 * @typedef {object} ToolCallPayload
 * @property {string}                   id       – Unique invocation identifier.
 * @property {string}                   toolName – Canonical tool name (e.g. `"web_search"`).
 * @property {Record<string, unknown>}  [toolArgs]
 *   Arbitrary arguments forwarded to the tool runtime.
 */

/**
 * `workflow_pending` / `node_pending` / `node_complete` — workflow & node
 * lifecycle transitions used for React Flow canvas synchronization.
 *
 * @typedef {object} WorkflowEventPayload
 * @property {string}  workflowId – ID of the currently active workflow.
 * @property {string}  [nodeId]   – ID of the specific node being executed.
 */

/**
 * `client_interaction` — the backend requests a client-side form submission
 * before the agent can continue.  The SSE stream is logically paused until
 * the user responds.
 *
 * @typedef {object} ClientInteractionPayload
 * @property {Array<Record<string, unknown>>} widgets       – Form control descriptors to render.
 * @property {string} [interactionId]
 *   Correlation ID for the user's response.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SSE_ENDPOINT = '/agent/chat';

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

/**
 * Custom hook that encapsulates the full lifecycle of an LLM streaming
 * conversation turn, backed by `@microsoft/fetch-event-source` and the
 * global `useChatStore` / `useAuthStore` Zustand stores.
 *
 * **Architecture invariants:**
 * - Token is read via `useAuthStore.getState()` at call-time (always fresh).
 * - All state mutations flow through `useChatStore` actions – no local
 *   `useState` for conversation data.
 * - The `onmessage` handler is wrapped in a fortified `try-catch` so that
 *   malformed SSE payloads can **never** crash the React render tree.
 * - `onerror` re-throws to disable the library's built-in auto-reconnect.
 *
 * @returns {UseAgentChatReturn}
 */
export function useAgentChat() {
  /** @type {import('react').MutableRefObject<AbortController | null>} */
  const controllerRef = useRef(null);

  // Clean up any in-flight connection when the consuming component unmounts.
  useEffect(() => () => { controllerRef.current?.abort(); }, []);

  // ---------------------------------------------------------------------------
  // sendMessage
  // ---------------------------------------------------------------------------

  const sendMessage = useCallback(
    /**
     * @param {string} content  – The user's plain-text prompt.
     * @param {SendMessageMeta} [metadata]
     */
    async (content, metadata = {}) => {
      const { token } = useAuthStore.getState();
      const {
        addMessage, updateMessage, setTyping, setWorkflowInfo,
      } = useChatStore.getState();

      // Abort any previously in-flight stream before opening a new one.
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      // ── Optimistic user message ──────────────────────────────────────
      const userMessageId = crypto.randomUUID();
      addMessage({
        id: userMessageId,
        role: 'user',
        content,
        timestamp: Date.now(),
        status: 'completed',
        metadata,
      });

      // ── Placeholder assistant message (will be hydrated by SSE) ─────
      const assistantMessageId = crypto.randomUUID();
      addMessage({
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        status: 'pending',
      });

      // Local accumulator for streamed content – avoids reading store on
      // every high-frequency `message_chunk` event.  The full string is
      // written into the store on each delta so React always sees the
      // latest snapshot via an immutable update.
      let streamedContent = '';

      // ── SSE connection ──────────────────────────────────────────────
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

      try {
        await fetchEventSource(`${baseUrl}${SSE_ENDPOINT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content, ...metadata }),
          signal: controller.signal,

          // ── onopen ────────────────────────────────────────────────
          async onopen(response) {
            if (!response.ok) {
              throw new Error(
                `SSE connection rejected: ${response.status} ${response.statusText}`,
              );
            }
            setTyping(true);
            updateMessage(assistantMessageId, { status: 'streaming' });
          },

          // ── onmessage (event router) ──────────────────────────────
          onmessage(msg) {
            let payload;
            try {
              payload = msg.data ? JSON.parse(msg.data) : {};
            } catch (parseError) {
              console.warn(
                '[useAgentChat] Malformed SSE payload – skipped:',
                msg.data,
                parseError,
              );
              return;
            }

            switch (msg.event) {
              // ── Streaming token delta ─────────────────────────────
              case 'message_chunk': {
                /** @type {MessageChunkPayload} */
                const { content: delta = '' } = payload;
                streamedContent += delta;
                updateMessage(assistantMessageId, {
                  content: streamedContent,
                  status: 'streaming',
                });
                break;
              }

              // ── Tool / function call ──────────────────────────────
              case 'tool_call': {
                /** @type {ToolCallPayload} */
                const { id: toolId, toolName, toolArgs } = payload;
                const resolvedToolId = toolId || crypto.randomUUID();
                addMessage({
                  id: resolvedToolId,
                  role: 'tool',
                  content: '',
                  timestamp: Date.now(),
                  status: 'pending',
                  toolCalls: [{
                    id: resolvedToolId,
                    name: toolName,
                    args: toolArgs,
                    status: 'running',
                  }],
                  metadata: { type: 'tool_call' },
                });
                break;
              }

              // ── Workflow lifecycle ─────────────────────────────────
              case 'workflow_pending': {
                /** @type {WorkflowEventPayload} */
                const { workflowId, nodeId } = payload;
                setWorkflowInfo(workflowId ?? null, nodeId ?? null);
                break;
              }

              case 'node_pending': {
                /** @type {WorkflowEventPayload} */
                const { workflowId, nodeId } = payload;
                setWorkflowInfo(workflowId ?? null, nodeId ?? null);
                break;
              }

              case 'node_complete': {
                /** @type {WorkflowEventPayload} */
                const { workflowId } = payload;
                setWorkflowInfo(workflowId ?? null, null);
                break;
              }

              // ── Client-side interruption ───────────────────────────
              case 'client_interaction': {
                /** @type {ClientInteractionPayload} */
                const { widgets = [], interactionId } = payload;
                setTyping(false);
                addMessage({
                  id: interactionId || crypto.randomUUID(),
                  role: 'assistant',
                  content: '',
                  timestamp: Date.now(),
                  status: 'completed',
                  metadata: { type: 'interaction', widgets },
                });
                break;
              }

              // ── Terminal events ────────────────────────────────────
              case 'complete':
                updateMessage(assistantMessageId, { status: 'completed' });
                setTyping(false);
                break;

              case 'error': {
                const serverMsg = payload?.message
                  || 'An error occurred while processing your request.';
                console.error('[SSE] Server-side error event:', payload);
                updateMessage(assistantMessageId, {
                  status: 'error',
                  content: serverMsg,
                });
                setTyping(false);
                break;
              }

              default:
                console.log('[SSE] Unhandled event:', msg.event, payload);
            }
          },

          // ── onclose ───────────────────────────────────────────────
          onclose() {
            setTyping(false);
            controllerRef.current = null;
          },

          // ── onerror ───────────────────────────────────────────────
          onerror(err) {
            console.error('[useAgentChat] SSE transport error:', err);

            const store = useChatStore.getState();
            store.setTyping(false);

            if (err?.name !== 'AbortError') {
              updateMessage(assistantMessageId, { status: 'error' });

              store.addMessage({
                id: crypto.randomUUID(),
                role: 'system',
                content: 'Connection lost. Please check your network and try again.',
                timestamp: Date.now(),
                status: 'error',
              });
            }

            controllerRef.current = null;

            // Re-throw to prevent fetch-event-source from auto-reconnecting.
            throw err;
          },
        });
      } catch (err) {
        if (err?.name === 'AbortError') return;
        console.error('[useAgentChat] Unhandled stream error:', err);
      }
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // stopStream
  // ---------------------------------------------------------------------------

  const stopStream = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    useChatStore.getState().setTyping(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Reactive state subscription (triggers re-render only when isTyping flips).
  // ---------------------------------------------------------------------------

  const isLoading = useChatStore((s) => s.isTyping);

  return { sendMessage, stopStream, isLoading };
}
