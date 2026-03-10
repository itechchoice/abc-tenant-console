import { useRef, useCallback, useEffect, type MutableRefObject } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useWorkflowRuntimeStore } from '@/stores/workflowRuntimeStore';
import { apiClient } from '@/http/client';
import type { Message } from '@/schemas/chatSchema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseAgentChatOptions {
  onSessionCreated?: (sessionId: string) => void;
}

interface SendMessageMeta {
  agentId?: string;
  sessionId?: string;
  extra?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface UseAgentChatReturn {
  sendMessage: (content: string, metadata?: SendMessageMeta) => Promise<void>;
  connectToTaskStream: (taskId: string, existingAssistantMessageId?: string) => Promise<void>;
  stopStream: () => void;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SSE_ENDPOINT = '/chat';
const TASKS_ENDPOINT = '/tasks';

// ---------------------------------------------------------------------------
// Shared helpers (module-level, not hook-dependent)
// ---------------------------------------------------------------------------

function getSSEHeaders(): Record<string, string> {
  const { token, userInfo } = useAuthStore.getState();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(userInfo?.tenantId ? { 'X-Tenant-Id': userInfo.tenantId } : {}),
  };
}

// ---------------------------------------------------------------------------
// SSE handler factory
// ---------------------------------------------------------------------------

interface BuildSSEHandlersCtx {
  assistantMessageId: string;
  onSessionCreatedRef: MutableRefObject<((sessionId: string) => void) | undefined>;
  controllerRef: MutableRefObject<AbortController | null>;
  initialContent?: string;
}

function buildSSEHandlers({
  assistantMessageId,
  onSessionCreatedRef,
  controllerRef,
  initialContent = '',
}: BuildSSEHandlersCtx) {
  let streamedContent = initialContent;

  function ensureResponseStep(chatMode: string) {
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
      nodeKey: responseNode as 'response' | 'respond',
      kind: 'phase',
      status: 'running',
      messageId: assistantMessageId,
      chatMode: chatMode as 'auto' | 'agent' | 'model',
    });
  }

  return {
    async onopen(response: Response) {
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

    onmessage(msg: { event: string; data: string }) {
      let payload: Record<string, unknown>;
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
        case 'INIT': {
          const { sessionId: newSid, taskId: initTaskId } = payload as { sessionId?: string; taskId?: string };
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

        case 'TOKEN_STREAM':
        case 'TEXT_CHUNK':
        case 'LLM_CHUNK': {
          let text = '';
          const raw = (payload as { payload?: unknown }).payload;

          if (typeof raw === 'string' && raw.startsWith('{')) {
            try {
              const inner = JSON.parse(raw) as { content?: string };
              text = inner.content || '';
            } catch {
              console.warn('[useAgentChat] Failed to parse inner payload:', raw);
            }
          } else {
            const r = raw as { content?: string } | string | undefined;
            const p = payload as { content?: string; data?: { text?: string } };
            text = (typeof r === 'object' ? r?.content : r) ?? p.content ?? p.data?.text ?? '';
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

        case 'TASK_CREATED': {
          const taskId = (payload.taskId ?? payload.id ?? null) as string | null;
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

        case 'STEP_START': {
          let stepName: string | null = null;
          const raw = (payload as { payload?: unknown; data?: unknown }).payload ?? (payload as { data?: unknown }).data;
          if (typeof raw === 'string') {
            try {
              const parsed = JSON.parse(raw) as { type?: string; stepName?: string };
              stepName = parsed.type || parsed.stepName || null;
            } catch {
              console.warn('[useAgentChat] Failed to parse STEP_START payload:', raw);
            }
          } else {
            stepName = (raw as { type?: string })?.type ?? (payload.type as string) ?? null;
          }
          setWorkflowState({ activeStepName: stepName, workflowStatus: 'running' });
          runtime.recordStep({
            stepName,
            taskId: (payload.taskId as string) ?? runtime.taskId,
            chatMode,
          });
          break;
        }

        case 'STEP_COMPLETE':
          break;

        case 'TASK_COMPLETED':
        case 'TASK_COMPLETE':
        case 'COMPLETED': {
          if (payload.payload) {
            ensureResponseStep(chatMode);
            streamedContent = payload.payload as string;
            updateMessage(assistantMessageId, { content: streamedContent });
          }
          updateMessage(assistantMessageId, { status: 'completed' });
          setTyping(false);
          setWorkflowState({ workflowStatus: 'completed', activeStepName: null });
          runtime.finishExecution('completed');
          break;
        }

        case 'TASK_FAILED': {
          const errMsg = (payload?.data as { message?: string })?.message
            ?? (payload?.message as string)
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

        case 'message_chunk': {
          const { content: delta = '' } = payload as { content?: string };
          streamedContent += delta;
          updateMessage(assistantMessageId, {
            content: streamedContent,
            status: 'streaming',
          });
          break;
        }

        case 'TOOL_CALL':
        case 'tool_call': {
          const src = (payload.data ?? payload) as {
            id?: string;
            toolName?: string;
            name?: string;
            toolArgs?: Record<string, unknown>;
            args?: Record<string, unknown>;
          };
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
              name: src.toolName ?? src.name ?? '',
              args: src.toolArgs ?? src.args,
              status: 'running',
            }],
            metadata: { type: 'tool_call' },
          });
          break;
        }

        case 'workflow_pending':
        case 'node_pending': {
          const { workflowId, nodeId } = payload as { workflowId?: string; nodeId?: string };
          setWorkflowInfo(workflowId ?? null, nodeId ?? null);
          runtime.syncExecutionContext({ workflowId: workflowId ?? null });
          break;
        }

        case 'node_complete': {
          const { workflowId } = payload as { workflowId?: string };
          setWorkflowInfo(workflowId ?? null, null);
          runtime.syncExecutionContext({ workflowId: workflowId ?? null });
          break;
        }

        case 'client_interaction': {
          const { widgets = [], interactionId } = payload as {
            widgets?: unknown[];
            interactionId?: string;
          };
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

        case 'complete':
          updateMessage(assistantMessageId, { status: 'completed' });
          setTyping(false);
          runtime.finishExecution('completed');
          break;

        case 'error': {
          const serverMsg = (payload?.message as string)
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

    onclose() {
      useChatStore.getState().setTyping(false);
      controllerRef.current = null;
    },

    onerror(err: Error & { name?: string }) {
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

export function useAgentChat(options: UseAgentChatOptions = {}): UseAgentChatReturn {
  const { onSessionCreated } = options;

  const controllerRef = useRef<AbortController | null>(null);
  const onSessionCreatedRef = useRef(onSessionCreated);
  onSessionCreatedRef.current = onSessionCreated;

  useEffect(() => () => { controllerRef.current?.abort(); }, []);

  const connectToTaskStream = useCallback(
    async (taskId: string, existingAssistantMessageId?: string) => {
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
          .find((m: Message) => m.id === assistantMessageId);
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
        if ((err as Error)?.name === 'AbortError') return;
        console.error('[useAgentChat] Task stream error:', err);
      }
    },
    [],
  );

  const sendMessage = useCallback(
    async (content: string, metadata: SendMessageMeta = {}) => {
      const {
        addMessage, updateMessage, setTyping,
        currentSessionId, chatMode, selectedAgentId, selectedModel,
        isHistoricalTrack,
      } = useChatStore.getState();

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

      const userMessageId = crypto.randomUUID();
      addMessage({
        id: userMessageId,
        role: 'user',
        content,
        timestamp: Date.now(),
        status: 'completed',
        metadata,
      });

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

      if (!isHistoricalTrack) {
        const reqPayload: Record<string, unknown> = { message: content };
        if (sessionId) reqPayload.sessionId = sessionId;
        if (chatMode === 'agent') reqPayload.agentId = selectedAgentId;
        if (chatMode === 'model') reqPayload.modelId = selectedModel!.id;

        const sseHandlers = buildSSEHandlers({
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
            ...sseHandlers,
          });
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return;
          console.error('[useAgentChat] Unhandled stream error:', err);
        }
        return;
      }

      const taskPayload: Record<string, unknown> = { message: content, sessionId };
      if (chatMode === 'agent') taskPayload.agentId = selectedAgentId;
      if (chatMode === 'model') taskPayload.modelId = selectedModel!.id;

      let taskId: string;
      try {
        const res = await apiClient.post(TASKS_ENDPOINT, taskPayload) as { data?: { taskId?: string }; taskId?: string };
        taskId = res?.data?.taskId ?? res?.taskId ?? '';
        if (!taskId) throw new Error('Missing taskId in POST /tasks response');
      } catch (taskErr) {
        if ((taskErr as Error)?.name === 'AbortError') return;
        console.error('[useAgentChat] POST /tasks failed:', taskErr);
        updateMessage(assistantMessageId, {
          status: 'error',
          content: 'Failed to create task. Please try again.',
        });
        setTyping(false);
        return;
      }

      const sseHandlers = buildSSEHandlers({
        assistantMessageId,
        onSessionCreatedRef,
        controllerRef,
      });

      try {
        await fetchEventSource(`${baseUrl}${TASKS_ENDPOINT}/${taskId}/events`, {
          method: 'GET',
          headers,
          signal: controller.signal,
          ...sseHandlers,
        });
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        console.error('[useAgentChat] Task stream error:', err);
      }
    },
    [],
  );

  const stopStream = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    useChatStore.getState().setTyping(false);
  }, []);

  const isLoading = useChatStore((s) => s.isTyping);

  return {
    sendMessage, connectToTaskStream, stopStream, isLoading,
  };
}
