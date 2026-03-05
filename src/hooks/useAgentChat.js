import { useRef, useCallback, useEffect } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';

/**
 * @typedef {import('@/schemas/chatSchema').Message} Message
 */

// ---------------------------------------------------------------------------
// JSDoc typedefs
// ---------------------------------------------------------------------------

/**
 * Options for {@link useAgentChat}.
 *
 * @typedef {object} UseAgentChatOptions
 * @property {(sessionId: string) => void} [onSessionCreated]
 *   Invoked when the backend returns a new sessionId via the INIT event.
 *   Use this to invalidate conversation list queries, etc.
 */

/**
 * Optional metadata forwarded alongside the user's prompt.
 *
 * @typedef {object} SendMessageMeta
 * @property {string} [agentId]   – Target agent identifier.
 * @property {string} [sessionId] – Existing session to continue.
 * @property {Record<string, unknown>} [extra]
 */

/**
 * Public API surface returned by {@link useAgentChat}.
 *
 * @typedef {object} UseAgentChatReturn
 * @property {(content: string, metadata?: SendMessageMeta) => Promise<void>} sendMessage
 * @property {() => void} stopStream
 * @property {boolean} isLoading
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SSE_ENDPOINT = '/chat';

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

/**
 * Encapsulates the full lifecycle of an LLM streaming conversation turn.
 *
 * Backed by `@microsoft/fetch-event-source` and Zustand stores.
 * Handles both the legacy event format (`message_chunk`, `complete`) and
 * the v2 format (`INIT`, `TEXT_CHUNK`, `COMPLETED`).
 *
 * @param {UseAgentChatOptions} [options]
 * @returns {UseAgentChatReturn}
 */
export function useAgentChat(options = {}) {
  const { onSessionCreated } = options;

  /** @type {import('react').MutableRefObject<AbortController | null>} */
  const controllerRef = useRef(null);
  const onSessionCreatedRef = useRef(onSessionCreated);
  onSessionCreatedRef.current = onSessionCreated;

  useEffect(() => () => { controllerRef.current?.abort(); }, []);

  // ---------------------------------------------------------------------------
  // sendMessage
  // ---------------------------------------------------------------------------

  const sendMessage = useCallback(
    /**
     * @param {string} content
     * @param {SendMessageMeta} [metadata]
     */
    async (content, metadata = {}) => {
      const { token, userInfo } = useAuthStore.getState();
      const {
        addMessage, updateMessage, setTyping, setWorkflowInfo,
        setCurrentSessionId, currentSessionId,
        chatMode, selectedAgentId, selectedModel,
      } = useChatStore.getState();

      // ── Defensive pre-flight checks ────────────────────────────────
      if (chatMode === 'agent' && !selectedAgentId) {
        console.warn('[useAgentChat] Agent mode requires a selected agentId — request blocked.');
        return;
      }
      if (chatMode === 'model' && !selectedModel) {
        console.warn('[useAgentChat] Model mode requires a selected model — request blocked.');
        return;
      }

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      // ── Optimistic user message ────────────────────────────────────
      const userMessageId = crypto.randomUUID();
      addMessage({
        id: userMessageId,
        role: 'user',
        content,
        timestamp: Date.now(),
        status: 'completed',
        metadata,
      });

      // ── Placeholder assistant message ──────────────────────────────
      const assistantMessageId = crypto.randomUUID();
      addMessage({
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        status: 'pending',
      });

      let streamedContent = '';

      // ── Build mode-aware payload (ENGINE_API POST /chat) ───────────
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      const sessionId = metadata.sessionId || currentSessionId || undefined;
      const tenantId = userInfo?.tenantId;

      const payload = { message: content };
      if (sessionId) payload.sessionId = sessionId;
      if (chatMode === 'agent') payload.agentId = selectedAgentId;
      if (chatMode === 'model') payload.modelId = selectedModel.id;

      try {
        await fetchEventSource(`${baseUrl}${SSE_ENDPOINT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
          },
          body: JSON.stringify(payload),
          signal: controller.signal,

          // ── onopen ─────────────────────────────────────────────────
          async onopen(response) {
            if (!response.ok) {
              throw new Error(
                `SSE connection rejected: ${response.status} ${response.statusText}`,
              );
            }
            setTyping(true);
            updateMessage(assistantMessageId, { status: 'streaming' });
          },

          // ── onmessage (event router) ───────────────────────────────
          onmessage(msg) {
            let payload;
            try {
              payload = msg.data ? JSON.parse(msg.data) : {};
            } catch {
              console.warn('[useAgentChat] Malformed SSE payload – skipped:', msg.data);
              return;
            }

            switch (msg.event) {
              // ── v2: Session initialisation ─────────────────────────
              case 'INIT': {
                const { sessionId: newSessionId } = payload;
                if (newSessionId) {
                  setCurrentSessionId(newSessionId);
                  onSessionCreatedRef.current?.(newSessionId);
                }
                break;
              }

              // ── v2: Streaming token delta ──────────────────────────
              case 'TEXT_CHUNK': {
                const text = payload.payload ?? payload.content ?? '';
                streamedContent += text;
                updateMessage(assistantMessageId, {
                  content: streamedContent,
                  status: 'streaming',
                });
                break;
              }

              // ── v2: Stream completed ───────────────────────────────
              case 'COMPLETED': {
                if (payload.payload) {
                  streamedContent = payload.payload;
                  updateMessage(assistantMessageId, { content: streamedContent });
                }
                updateMessage(assistantMessageId, { status: 'completed' });
                setTyping(false);
                break;
              }

              // ── Legacy: message_chunk ──────────────────────────────
              case 'message_chunk': {
                const { content: delta = '' } = payload;
                streamedContent += delta;
                updateMessage(assistantMessageId, {
                  content: streamedContent,
                  status: 'streaming',
                });
                break;
              }

              // ── Legacy: tool_call ──────────────────────────────────
              case 'tool_call': {
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

              // ── Workflow lifecycle ──────────────────────────────────
              case 'workflow_pending':
              case 'node_pending': {
                const { workflowId, nodeId } = payload;
                setWorkflowInfo(workflowId ?? null, nodeId ?? null);
                break;
              }

              case 'node_complete': {
                const { workflowId } = payload;
                setWorkflowInfo(workflowId ?? null, null);
                break;
              }

              // ── Client-side interruption ───────────────────────────
              case 'client_interaction': {
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

              // ── Legacy: complete ───────────────────────────────────
              case 'complete':
                updateMessage(assistantMessageId, { status: 'completed' });
                setTyping(false);
                break;

              // ── Error ──────────────────────────────────────────────
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
                break;
            }
          },

          // ── onclose ────────────────────────────────────────────────
          onclose() {
            setTyping(false);
            controllerRef.current = null;
          },

          // ── onerror ────────────────────────────────────────────────
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
  // Reactive state
  // ---------------------------------------------------------------------------

  const isLoading = useChatStore((s) => s.isTyping);

  return { sendMessage, stopStream, isLoading };
}
