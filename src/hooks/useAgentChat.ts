import { useCallback, useEffect, useRef } from 'react';
import { useChatStore, selectIsTyping } from '@/stores/chatStore';
import { taskStreamManager, type SendMessageMeta } from '@/services/taskStreamManager';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseAgentChatOptions {
  onSessionCreated?: (sessionId: string) => void;
}

export interface UseAgentChatReturn {
  sendMessage: (content: string, metadata?: SendMessageMeta) => Promise<void>;
  connectToTaskStream: (taskId: string, existingAssistantMessageId?: string) => Promise<void>;
  stopStream: () => void;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAgentChat(options: UseAgentChatOptions = {}): UseAgentChatReturn {
  const { onSessionCreated } = options;
  const callbackRef = useRef(onSessionCreated);
  callbackRef.current = onSessionCreated;

  useEffect(() => () => {
    // Component unmount — streams continue in background
  }, []);

  const sendMessage = useCallback(
    async (content: string, meta: SendMessageMeta = {}) => {
      await taskStreamManager.sendMessage(content, meta, {
        onSessionCreated: (sid) => callbackRef.current?.(sid),
      });
    },
    [],
  );

  const connectToTaskStream = useCallback(
    async (taskId: string, existingAssistantMessageId?: string) => {
      const sessionId = useChatStore.getState().currentSessionId;
      if (!sessionId) return;
      await taskStreamManager.connectToStream(
        taskId,
        sessionId,
        existingAssistantMessageId,
        (sid) => callbackRef.current?.(sid),
      );
    },
    [],
  );

  const stopStream = useCallback(() => {
    const sessionId = useChatStore.getState().currentSessionId;
    if (!sessionId) return;
    const taskIds = taskStreamManager.getActiveTaskIds(sessionId);
    for (const id of taskIds) {
      taskStreamManager.stopStream(id);
    }
  }, []);

  const isLoading = useChatStore(selectIsTyping);

  return { sendMessage, connectToTaskStream, stopStream, isLoading };
}
