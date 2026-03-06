import { useRef, useCallback, useEffect } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useWorkflowRuntimeStore } from '@/stores/workflowRuntimeStore';
import { apiClient } from '@/http/client';

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
 * @property {(taskId: string, existingAssistantMessageId?: string)
 *   => Promise<void>} connectToTaskStream
 * @property {() => void} stopStream
 * @property {boolean} isLoading
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SSE_ENDPOINT = '/chat';
const TASKS_ENDPOINT = '/tasks';

// ---------------------------------------------------------------------------
// Shared helpers (module-level, not hook-dependent)
// ---------------------------------------------------------------------------

/** @returns {Record<string, string>} */
function getSSEHeaders() {
  const { token, userInfo } = useAuthStore.getState();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(userInfo?.tenantId ? { 'X-Tenant-Id': userInfo.tenantId } : {}),
  };
}

// ---------------------------------------------------------------------------
// SSE handler factory — reused by BOTH quick track and historical track.
// ---------------------------------------------------------------------------

/**
 * Creates the full set of `fetchEventSource` callbacks that drive
 * the Zustand store.  Encapsulates the `streamedContent` accumulator
 * as a closure variable so callers never need to manage it.
 *
 * @param {object} ctx
 * @param {string} ctx.assistantMessageId
 * @param {import('react').MutableRefObject} ctx.onSessionCreatedRef
 * @param {import('react').MutableRefObject<AbortController|null>} ctx.controllerRef
 * @param {string} [ctx.initialContent]  Pre-existing content for resumption.
 */
function buildSSEHandlers({
  assistantMessageId,
  onSessionCreatedRef,
  controllerRef,
  initialContent = '',
}) {
  let streamedContent = initialContent;

  function ensureResponseStep(chatMode) {
    const runtime = useWorkflowRuntimeStore.getState();
    if (runtime.phase === 'idle') return;

    const currentStep = runtime.steps.find((step) => step.id === runtime.currentStepId);
    const responseNode = chatMode === 'model' ? 'response' : 'respond';
    if (currentStep?.nodeKey === responseNode && currentStep.status === 'running') {
      return;
    }

    runtime.recordStep({
      stepId: `${assistantMessageId}-${responseNode}`,
      stepName: chatMode === 'model' ? 'MODEL_RESPONSE' : 'FINAL_RESPONSE',
      title: chatMode === 'model' ? 'Streaming response' : 'Drafting response',
      detail: chatMode === 'model'
        ? 'The model is generating a direct answer.'
        : 'Preparing the final response for the user.',
      nodeKey: responseNode,
      kind: 'phase',
      status: 'running',
      messageId: assistantMessageId,
      chatMode,
    });
  }

  return {
    // ── onopen ───────────────────────────────────────────────────────
    async onopen(response) {
      if (!response.ok) {
        throw new Error(
          `SSE connection rejected: ${response.status} ${response.statusText}`,
        );
      }
      const { setTyping, updateMessage } = useChatStore.getState();
      const { chatMode } = useChatStore.getState();
      setTyping(true);
      updateMessage(assistantMessageId, { status: 'streaming' });

      if (chatMode === 'model') {
        const runtime = useWorkflowRuntimeStore.getState();
        runtime.startExecution({
          chatMode,
          status: 'preparing',
          nodeKey: 'prompt',
        });
        runtime.recordStep({
          stepId: `${assistantMessageId}-model`,
          stepName: 'MODEL_INFERENCE',
          title: 'Running model',
          detail: 'Generating a direct model response.',
          nodeKey: 'model',
          kind: 'phase',
          status: 'running',
          messageId: assistantMessageId,
          chatMode,
        });
      }
    },

    // ── onmessage (event router) ─────────────────────────────────────
    onmessage(msg) {
      let payload;
      try {
        payload = msg.data ? JSON.parse(msg.data) : {};
      } catch {
        console.warn('[useAgentChat] Malformed SSE payload – skipped:', msg.data);
        return;
      }

      const {
        addMessage, updateMessage, setTyping, setWorkflowInfo,
        setWorkflowState, setCurrentSessionId,
      } = useChatStore.getState();
      const runtime = useWorkflowRuntimeStore.getState();
      const { chatMode } = useChatStore.getState();

      switch (msg.event) {
        // ── Session initialisation (POST /chat only) ────────────────
        case 'INIT': {
          const { sessionId: newSid, taskId: initTaskId } = payload;
          if (newSid) {
            setCurrentSessionId(newSid);
            onSessionCreatedRef.current?.(newSid);
          }
          if (initTaskId) {
            setWorkflowState({
              activeTaskId: initTaskId,
              workflowStatus: 'running',
              activeStepName: 'init',
            });
          }

          runtime.startExecution({
            sessionId: newSid ?? null,
            taskId: initTaskId ?? null,
            chatMode,
            status: 'preparing',
          });

          if (initTaskId) {
            runtime.recordStep({
              stepId: `${initTaskId}-prepare`,
              stepName: 'INIT',
              title: 'Preparing execution',
              detail: 'Booting the orchestration runtime.',
              nodeKey: chatMode === 'model' ? 'prompt' : 'understand',
              kind: 'phase',
              status: 'running',
              taskId: initTaskId,
              chatMode,
            });
          }
          break;
        }

        // ── Streaming token delta ───────────────────────────────────
        case 'TOKEN_STREAM':
        case 'TEXT_CHUNK':
        case 'LLM_CHUNK': {
          let text = '';
          const raw = payload.payload;

          if (typeof raw === 'string' && raw.startsWith('{')) {
            try {
              const inner = JSON.parse(raw);
              text = inner.content || '';
            } catch {
              console.warn('[useAgentChat] Failed to parse inner payload:', raw);
            }
          } else {
            text = raw?.content ?? raw ?? payload.content ?? payload.data?.text ?? '';
          }

          if (text) {
            ensureResponseStep(chatMode);
            streamedContent += text;
            updateMessage(assistantMessageId, {
              content: streamedContent,
              status: 'streaming',
            });
          }
          break;
        }

        // ── Task lifecycle — creation ───────────────────────────────
        case 'TASK_CREATED': {
          const taskId = payload.taskId ?? payload.id ?? null;
          setWorkflowState({
            activeTaskId: taskId,
            workflowStatus: 'running',
            activeStepName: 'init',
          });
          runtime.startExecution({
            taskId,
            chatMode,
            status: 'preparing',
          });
          runtime.recordStep({
            stepId: `${taskId || assistantMessageId}-prepare`,
            stepName: 'INIT',
            title: 'Preparing execution',
            detail: 'Allocating the runtime task and initial context.',
            nodeKey: chatMode === 'model' ? 'prompt' : 'understand',
            kind: 'phase',
            status: 'running',
            taskId,
            chatMode,
          });
          break;
        }

        // ── Task lifecycle — step execution ─────────────────────────
        case 'STEP_START': {
          let stepName = null;
          const raw = payload.payload ?? payload.data;
          if (typeof raw === 'string') {
            try {
              const parsed = JSON.parse(raw);
              stepName = parsed.type || parsed.stepName || null;
            } catch {
              console.warn('[useAgentChat] Failed to parse STEP_START payload:', raw);
            }
          } else {
            stepName = raw?.type ?? payload.type ?? null;
          }
          setWorkflowState({ activeStepName: stepName, workflowStatus: 'running' });
          runtime.recordStep({
            stepName,
            taskId: payload.taskId ?? runtime.taskId,
            chatMode,
          });
          break;
        }

        // ── Step complete (informational) ───────────────────────────
        case 'STEP_COMPLETE':
          break;

        // ── Stream / task completed ─────────────────────────────────
        case 'TASK_COMPLETED':
        case 'TASK_COMPLETE':
        case 'COMPLETED': {
          if (payload.payload) {
            ensureResponseStep(chatMode);
            streamedContent = payload.payload;
            updateMessage(assistantMessageId, { content: streamedContent });
          }
          updateMessage(assistantMessageId, { status: 'completed' });
          setTyping(false);
          setWorkflowState({ workflowStatus: 'completed', activeStepName: null });
          runtime.finishExecution('completed');
          break;
        }

        // ── Task failed ─────────────────────────────────────────────
        case 'TASK_FAILED': {
          const errMsg = payload?.data?.message
            ?? payload?.message
            ?? 'Task execution failed.';
          console.error('[SSE] Task failed:', payload);
          updateMessage(assistantMessageId, { status: 'error', content: errMsg });
          setTyping(false);
          setWorkflowState({ workflowStatus: 'completed', activeStepName: null });
          runtime.recordStep({
            stepId: `${runtime.taskId || assistantMessageId}-failed`,
            stepName: 'TASK_FAILED',
            title: 'Execution failed',
            detail: errMsg,
            nodeKey: runtime.currentNodeKey || (chatMode === 'model' ? 'response' : 'respond'),
            kind: 'system',
            status: 'failed',
            messageId: assistantMessageId,
            error: errMsg,
            chatMode,
          });
          runtime.finishExecution('failed');
          break;
        }

        // ── Legacy: message_chunk ───────────────────────────────────
        case 'message_chunk': {
          const { content: delta = '' } = payload;
          streamedContent += delta;
          updateMessage(assistantMessageId, {
            content: streamedContent,
            status: 'streaming',
          });
          break;
        }

        // ── Tool call ───────────────────────────────────────────────
        case 'TOOL_CALL':
        case 'tool_call': {
          const src = payload.data ?? payload;
          const resolvedToolId = src.id || crypto.randomUUID();
          runtime.recordToolCall({
            messageId: resolvedToolId,
            toolName: src.toolName ?? src.name ?? null,
            args: src.toolArgs ?? src.args,
            taskId: runtime.taskId,
            chatMode,
          });
          addMessage({
            id: resolvedToolId,
            role: 'tool',
            content: '',
            timestamp: Date.now(),
            status: 'pending',
            toolCalls: [{
              id: resolvedToolId,
              name: src.toolName ?? src.name,
              args: src.toolArgs ?? src.args,
              status: 'running',
            }],
            metadata: { type: 'tool_call' },
          });
          break;
        }

        // ── Workflow lifecycle ───────────────────────────────────────
        case 'workflow_pending':
        case 'node_pending': {
          const { workflowId, nodeId } = payload;
          setWorkflowInfo(workflowId ?? null, nodeId ?? null);
          runtime.syncExecutionContext({ workflowId: workflowId ?? null });
          break;
        }

        case 'node_complete': {
          const { workflowId } = payload;
          setWorkflowInfo(workflowId ?? null, null);
          runtime.syncExecutionContext({ workflowId: workflowId ?? null });
          break;
        }

        // ── Client-side interruption ────────────────────────────────
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
          runtime.markAwaitingInteraction({
            interactionId: interactionId ?? null,
            messageId: interactionId ?? null,
            widgetCount: widgets.length,
            chatMode,
          });
          break;
        }

        // ── Legacy: complete ────────────────────────────────────────
        case 'complete':
          updateMessage(assistantMessageId, { status: 'completed' });
          setTyping(false);
          runtime.finishExecution('completed');
          break;

        // ── Error ───────────────────────────────────────────────────
        case 'error': {
          const serverMsg = payload?.message
            || 'An error occurred while processing your request.';
          console.error('[SSE] Server-side error event:', payload);
          updateMessage(assistantMessageId, {
            status: 'error',
            content: serverMsg,
          });
          setTyping(false);
          runtime.recordStep({
            stepId: `${runtime.taskId || assistantMessageId}-server-error`,
            stepName: 'ERROR',
            title: 'Server error',
            detail: serverMsg,
            nodeKey: runtime.currentNodeKey || (chatMode === 'model' ? 'response' : 'respond'),
            kind: 'system',
            status: 'failed',
            messageId: assistantMessageId,
            error: serverMsg,
            chatMode,
          });
          runtime.finishExecution('failed');
          break;
        }

        default:
          break;
      }
    },

    // ── onclose ──────────────────────────────────────────────────────
    onclose() {
      useChatStore.getState().setTyping(false);
      controllerRef.current = null;
    },

    // ── onerror ──────────────────────────────────────────────────────
    onerror(err) {
      console.error('[useAgentChat] SSE transport error:', err);

      const store = useChatStore.getState();
      store.setTyping(false);

      if (err?.name !== 'AbortError') {
        store.updateMessage(assistantMessageId, { status: 'error' });
        store.addMessage({
          id: crypto.randomUUID(),
          role: 'system',
          content: 'Connection lost. Please check your network and try again.',
          timestamp: Date.now(),
          status: 'error',
        });
        useWorkflowRuntimeStore.getState().recordStep({
          stepId: `${assistantMessageId}-transport-error`,
          stepName: 'TRANSPORT_ERROR',
          title: 'Connection lost',
          detail: 'The live connection was interrupted before the task finished.',
          nodeKey: useWorkflowRuntimeStore.getState().currentNodeKey
            || (useChatStore.getState().chatMode === 'model' ? 'response' : 'respond'),
          kind: 'system',
          status: 'failed',
          messageId: assistantMessageId,
          chatMode: useChatStore.getState().chatMode,
        });
        useWorkflowRuntimeStore.getState().finishExecution('failed');
      }

      controllerRef.current = null;
      throw err;
    },
  };
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

/**
 * Encapsulates the full lifecycle of an LLM streaming conversation turn
 * with **dual-track** dispatch:
 *
 * - **Quick track** (`!isHistoricalTrack`):  `POST /chat` SSE — for new chats.
 * - **Historical track** (`isHistoricalTrack`):
 *     1. `POST /tasks` (HTTP) to create a task, then
 *     2. `GET /tasks/{taskId}/events` SSE to stream results.
 *
 * Both tracks share the **exact same** SSE event router via `buildSSEHandlers`.
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
  // connectToTaskStream — attaches to a running or newly-created task's SSE.
  // ---------------------------------------------------------------------------

  const connectToTaskStream = useCallback(
    /**
     * @param {string} taskId
     * @param {string} [existingAssistantMessageId]
     *   Pass the ID of an already-rendered assistant message (e.g. when
     *   resuming a RUNNING task from session history).  If omitted a new
     *   placeholder message is created automatically.
     */
    async (taskId, existingAssistantMessageId) => {
      useWorkflowRuntimeStore.getState().startExecution({
        taskId,
        chatMode: useChatStore.getState().chatMode,
        status: 'running',
      });
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      let assistantMessageId = existingAssistantMessageId;
      let initialContent = '';

      if (!assistantMessageId) {
        assistantMessageId = crypto.randomUUID();
        useChatStore.getState().addMessage({
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          status: 'pending',
        });
      } else {
        const existing = useChatStore.getState().messages
          .find((m) => m.id === assistantMessageId);
        initialContent = existing?.content || '';
      }

      const handlers = buildSSEHandlers({
        assistantMessageId,
        onSessionCreatedRef,
        controllerRef,
        initialContent,
      });

      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/tenant-console-api';

      try {
        await fetchEventSource(`${baseUrl}${TASKS_ENDPOINT}/${taskId}/events`, {
          method: 'GET',
          headers: getSSEHeaders(),
          signal: controller.signal,
          ...handlers,
        });
      } catch (err) {
        if (err?.name === 'AbortError') return;
        console.error('[useAgentChat] Task stream error:', err);
      }
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // sendMessage — dual-track dispatch
  // ---------------------------------------------------------------------------

  const sendMessage = useCallback(
    /**
     * @param {string} content
     * @param {SendMessageMeta} [metadata]
     */
    async (content, metadata = {}) => {
      const {
        addMessage, updateMessage, setTyping,
        currentSessionId, chatMode, selectedAgentId, selectedModel,
        isHistoricalTrack,
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

      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/tenant-console-api';
      const sessionId = metadata.sessionId || currentSessionId || undefined;
      const headers = getSSEHeaders();

      if (chatMode === 'agent') {
        useWorkflowRuntimeStore.getState().startExecution({
          sessionId: sessionId ?? null,
          chatMode,
          status: 'preparing',
          nodeKey: 'understand',
        });
      }

      // ==================================================================
      // TRACK A — Quick flow: POST /chat (new conversations)
      // ==================================================================
      if (!isHistoricalTrack) {
        const reqPayload = { message: content };
        if (sessionId) reqPayload.sessionId = sessionId;
        if (chatMode === 'agent') reqPayload.agentId = selectedAgentId;
        if (chatMode === 'model') reqPayload.modelId = selectedModel.id;

        const handlers = buildSSEHandlers({
          assistantMessageId,
          onSessionCreatedRef,
          controllerRef,
        });

        try {
          await fetchEventSource(`${baseUrl}${SSE_ENDPOINT}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(reqPayload),
            signal: controller.signal,
            ...handlers,
          });
        } catch (err) {
          if (err?.name === 'AbortError') return;
          console.error('[useAgentChat] Unhandled stream error:', err);
        }
        return;
      }

      // ==================================================================
      // TRACK B — Historical flow: POST /tasks → GET /tasks/{id}/events
      // ==================================================================
      const taskPayload = { message: content, sessionId };
      if (chatMode === 'agent') taskPayload.agentId = selectedAgentId;
      if (chatMode === 'model') taskPayload.modelId = selectedModel.id;

      let taskId;
      try {
        const res = await apiClient.post(TASKS_ENDPOINT, taskPayload);
        taskId = res?.data?.taskId ?? res?.taskId;
        if (!taskId) throw new Error('Missing taskId in POST /tasks response');
      } catch (taskErr) {
        if (taskErr?.name === 'AbortError') return;
        console.error('[useAgentChat] POST /tasks failed:', taskErr);
        updateMessage(assistantMessageId, {
          status: 'error',
          content: 'Failed to create task. Please try again.',
        });
        setTyping(false);
        return;
      }

      const handlers = buildSSEHandlers({
        assistantMessageId,
        onSessionCreatedRef,
        controllerRef,
      });

      try {
        await fetchEventSource(`${baseUrl}${TASKS_ENDPOINT}/${taskId}/events`, {
          method: 'GET',
          headers,
          signal: controller.signal,
          ...handlers,
        });
      } catch (err) {
        if (err?.name === 'AbortError') return;
        console.error('[useAgentChat] Task stream error:', err);
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

  return {
    sendMessage, connectToTaskStream, stopStream, isLoading,
  };
}
