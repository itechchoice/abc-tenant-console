import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore, PENDING_SESSION_ID } from '@/stores/chatStore';
import { useWorkflowRuntimeStore } from '@/stores/workflowRuntimeStore';
import { createRequestId, engineApiBaseUrl } from '@/http/client';
import { createTask, cancelTask } from '@/http/taskApi';
import { parseTaskEvent, TOKEN_EVENT_TYPES, TERMINAL_EVENT_TYPES } from '@/schemas/taskEventSchema';
import { dispatchEvent } from './eventHandlers';
import type { StreamContext } from './eventHandlers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActiveStream {
  taskId: string;
  sessionId: string;
  assistantMessageId: string;
  controller: AbortController;
  context: StreamContext;
  flushRafId: number | null;
  startedAt: number;
}

export interface SendMessageMeta {
  sessionId?: string;
  capabilities?: string[];
  extra?: Record<string, unknown>;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TASKS_ENDPOINT = '/tasks';
const CHAT_MODE = 'model' as const;
const MAX_CONCURRENT_STREAMS = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSSEHeaders(): Record<string, string> {
  const { token, userInfo } = useAuthStore.getState();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(userInfo?.tenantId ? { 'X-Tenant-Id': userInfo.tenantId } : {}),
    'X-Request-Id': createRequestId(),
  };
}

function buildStreamContext(
  stream: ActiveStream,
  onSessionCreated?: (sessionId: string) => void,
): StreamContext {
  const store = useChatStore.getState();
  const runtime = useWorkflowRuntimeStore.getState();

  return {
    taskId: stream.taskId,
    sessionId: stream.sessionId,
    assistantMessageId: stream.assistantMessageId,
    chatMode: CHAT_MODE,
    streamedContent: '',
    needsFlush: false,

    addMessage: store.addMessage,
    updateMessage: store.updateMessage,
    getMessage: store.getMessage,
    setTyping: store.setTyping,

    startWorkflowExecution: store.startWorkflowExecution,
    updateNodeState: store.updateNodeState,
    finishWorkflowExecution: store.finishWorkflowExecution,
    appendStepEvent: store.appendStepEvent,
    activeWorkflowId: null,

    runtime: {
      startExecution: runtime.startExecution,
      recordStep: runtime.recordStep,
      recordToolCall: runtime.recordToolCall,
      finishExecution: runtime.finishExecution,
      syncExecutionContext: runtime.syncExecutionContext,
      markAwaitingInteraction: runtime.markAwaitingInteraction,
      get taskId() { return useWorkflowRuntimeStore.getState().taskId; },
      get currentNodeKey() { return useWorkflowRuntimeStore.getState().currentNodeKey; },
      get phase() { return useWorkflowRuntimeStore.getState().phase; },
      get steps() { return useWorkflowRuntimeStore.getState().steps; },
      get currentStepId() { return useWorkflowRuntimeStore.getState().currentStepId; },
    },

    onSessionCreated,
    onStreamComplete: () => {
      manager.removeStream(stream.taskId);
    },
  };
}

// ---------------------------------------------------------------------------
// TaskStreamManager
// ---------------------------------------------------------------------------

class TaskStreamManager {
  private streams = new Map<string, ActiveStream>();

  async sendMessage(
    content: string,
    meta: SendMessageMeta = {},
    callbacks?: { onSessionCreated?: (sessionId: string) => void },
  ): Promise<void> {
    const store = useChatStore.getState();
    const sessionId = meta.sessionId || store.currentSessionId || PENDING_SESSION_ID;

    store.ensureSession(sessionId);

    const userMessageId = crypto.randomUUID();
    store.addMessage(sessionId, {
      id: userMessageId,
      role: 'user',
      content,
      timestamp: Date.now(),
      status: 'completed',
      metadata: meta,
    });

    const assistantMessageId = crypto.randomUUID();
    store.addMessage(sessionId, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'pending',
    });

    const taskPayload: Record<string, unknown> = { message: content };
    if (store.selectedModel) taskPayload.modelId = store.selectedModel.id;
    if (sessionId !== PENDING_SESSION_ID) taskPayload.sessionId = sessionId;
    if (meta.capabilities?.length) taskPayload.capabilities = meta.capabilities;

    let taskId: string;
    try {
      const res = await createTask(taskPayload);
      taskId = res.taskId;

      if (res.sessionId && sessionId === PENDING_SESSION_ID) {
        store.migrateSession(PENDING_SESSION_ID, res.sessionId);
        store.switchSession(res.sessionId);
        callbacks?.onSessionCreated?.(res.sessionId);
      } else if (res.sessionId && !store.currentSessionId) {
        store.switchSession(res.sessionId);
        callbacks?.onSessionCreated?.(res.sessionId);
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      console.error('[TaskStreamManager] POST /tasks failed:', err);
      store.updateMessage(sessionId, assistantMessageId, {
        status: 'error',
        content: 'Failed to create task. Please try again.',
      });
      return;
    }

    const resolvedSessionId = useChatStore.getState().currentSessionId ?? sessionId;
    await this.connectToStream(
      taskId,
      resolvedSessionId,
      assistantMessageId,
      callbacks?.onSessionCreated,
    );
  }

  async connectToStream(
    taskId: string,
    sessionId: string,
    assistantMessageId?: string,
    onSessionCreated?: (sessionId: string) => void,
  ): Promise<void> {
    this.enforceConcurrencyLimit();

    const store = useChatStore.getState();
    store.ensureSession(sessionId);

    let msgId = assistantMessageId;
    let initialContent = '';

    if (!msgId) {
      msgId = crypto.randomUUID();
      store.addMessage(sessionId, {
        id: msgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        status: 'pending',
      });
    } else {
      initialContent = store.getMessage(sessionId, msgId)?.content || '';
    }

    const controller = new AbortController();
    const stream: ActiveStream = {
      taskId,
      sessionId,
      assistantMessageId: msgId,
      controller,
      context: null!,
      flushRafId: null,
      startedAt: Date.now(),
    };

    stream.context = buildStreamContext(stream, onSessionCreated);
    stream.context.streamedContent = initialContent;

    this.streams.set(taskId, stream);

    useWorkflowRuntimeStore.getState().startExecution({
      taskId,
      chatMode: CHAT_MODE,
      status: 'running',
    });
    store.setTyping(sessionId, true);
    store.updateMessage(sessionId, msgId, { status: 'streaming' });

    try {
      await fetchEventSource(`${engineApiBaseUrl}${TASKS_ENDPOINT}/${taskId}/events`, {
        method: 'GET',
        headers: getSSEHeaders(),
        signal: controller.signal,

        onopen: async (response) => {
          if (!response.ok) {
            throw new Error(`SSE rejected: ${response.status} ${response.statusText}`);
          }

          useWorkflowRuntimeStore.getState().recordStep({
            stepId: `${msgId}-model`,
            stepName: 'MODEL_INFERENCE',
            title: 'Running model',
            detail: 'Generating a direct model response.',
            nodeKey: 'model',
            kind: 'phase',
            status: 'running',
            messageId: msgId,
            chatMode: CHAT_MODE,
          });
        },

        onmessage: (msg) => {
          const event = parseTaskEvent(msg.data);
          if (!event) return;

          const ctx = stream.context;
          ctx.addMessage = useChatStore.getState().addMessage;
          ctx.updateMessage = useChatStore.getState().updateMessage;
          ctx.getMessage = useChatStore.getState().getMessage;
          ctx.setTyping = useChatStore.getState().setTyping;

          dispatchEvent(event, ctx);

          if (TOKEN_EVENT_TYPES.has(event.type) && ctx.needsFlush && !stream.flushRafId) {
            stream.flushRafId = requestAnimationFrame(() => {
              stream.flushRafId = null;
              ctx.needsFlush = false;
              useChatStore.getState().updateMessage(stream.sessionId, stream.assistantMessageId, {
                content: ctx.streamedContent,
                status: 'streaming',
              });
            });
          }

          if (TERMINAL_EVENT_TYPES.has(event.type)) {
            this.flushAndCleanup(stream);
          }
        },

        onclose: () => {
          useChatStore.getState().setTyping(sessionId, false);
          this.streams.delete(taskId);
        },

        onerror: (err) => {
          console.error('[TaskStreamManager] SSE error:', err);
          const s = useChatStore.getState();
          s.setTyping(sessionId, false);

          if ((err as Error)?.name !== 'AbortError') {
            s.updateMessage(sessionId, stream.assistantMessageId, { status: 'error' });
            s.addMessage(sessionId, {
              id: crypto.randomUUID(),
              role: 'system',
              content: 'Connection lost. Please check your network and try again.',
              timestamp: Date.now(),
              status: 'error',
            });
            useWorkflowRuntimeStore.getState().finishExecution('failed');
          }

          this.streams.delete(taskId);
          throw err;
        },
      });
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      console.error('[TaskStreamManager] Stream error:', err);
    }
  }

  stopStream(taskId: string): void {
    const stream = this.streams.get(taskId);
    if (!stream) return;

    stream.controller.abort();
    this.flushAndCleanup(stream);
    useChatStore.getState().setTyping(stream.sessionId, false);
    this.streams.delete(taskId);

    cancelTask(taskId).catch((err) => {
      console.warn('[TaskStreamManager] Cancel failed (non-critical):', err);
    });
  }

  stopAllStreams(): void {
    for (const taskId of [...this.streams.keys()]) {
      this.stopStream(taskId);
    }
  }

  stopSessionStreams(sessionId: string): void {
    for (const [taskId, stream] of this.streams) {
      if (stream.sessionId === sessionId) {
        this.stopStream(taskId);
      }
    }
  }

  hasActiveStreams(sessionId?: string): boolean {
    if (!sessionId) return this.streams.size > 0;
    for (const stream of this.streams.values()) {
      if (stream.sessionId === sessionId) return true;
    }
    return false;
  }

  getActiveTaskIds(sessionId?: string): string[] {
    const ids: string[] = [];
    for (const [taskId, stream] of this.streams) {
      if (!sessionId || stream.sessionId === sessionId) ids.push(taskId);
    }
    return ids;
  }

  removeStream(taskId: string): void {
    const stream = this.streams.get(taskId);
    if (stream) {
      if (stream.flushRafId) cancelAnimationFrame(stream.flushRafId);
      this.streams.delete(taskId);
    }
  }

  private flushAndCleanup(stream: ActiveStream): void {
    if (stream.flushRafId) {
      cancelAnimationFrame(stream.flushRafId);
      stream.flushRafId = null;
    }

    if (stream.context.needsFlush) {
      stream.context.needsFlush = false;
      useChatStore.getState().updateMessage(stream.sessionId, stream.assistantMessageId, {
        content: stream.context.streamedContent,
        status: 'streaming',
      });
    }
  }

  private enforceConcurrencyLimit(): void {
    if (this.streams.size < MAX_CONCURRENT_STREAMS) return;

    const oldest = [...this.streams.values()]
      .sort((a, b) => a.startedAt - b.startedAt)[0];
    if (oldest) this.stopStream(oldest.taskId);
  }
}

const manager = new TaskStreamManager();
export const taskStreamManager = manager;
