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
      const { addMessage, updateMessage, setTyping } = useChatStore.getState();

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
              case 'message_chunk':
                // TODO: phase-2 — append delta to assistant message
                console.log('[SSE] message_chunk', payload);
                break;

              // ── Tool / function call ──────────────────────────────
              case 'tool_call':
                // TODO: phase-2 — attach tool call, render waiting UI
                console.log('[SSE] tool_call', payload);
                break;

              // ── Workflow lifecycle ─────────────────────────────────
              case 'workflow_pending':
                // TODO: phase-2 — sync workflow state to store
                console.log('[SSE] workflow_pending', payload);
                break;

              case 'node_pending':
                // TODO: phase-2 — highlight executing node on canvas
                console.log('[SSE] node_pending', payload);
                break;

              case 'node_complete':
                // TODO: phase-2 — mark node execution as finished
                console.log('[SSE] node_complete', payload);
                break;

              // ── Client-side interruption ───────────────────────────
              case 'client_interaction':
                // TODO: phase-2 — render interactive form, discard connection
                console.log('[SSE] client_interaction', payload);
                break;

              // ── Terminal events ────────────────────────────────────
              case 'complete':
                updateMessage(assistantMessageId, { status: 'completed' });
                setTyping(false);
                break;

              case 'error': {
                const serverMsg = payload?.message || 'The server encountered an error while processing your request.';
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
