import {
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChatMain } from '@/components/Chat/ChatMain';
import { useConversationDetail, chatQueryKeys } from '@/hooks/useChatHistory';
import { useAgentChat } from '@/hooks/useAgentChat';
import { useChatStore } from '@/stores/chatStore';
import { ChatInput } from './ChatInput';
import { ChatSkeleton } from './ChatSkeleton';
import { WelcomeState } from './WelcomeState';

export default function ChatPanel() {
  const currentSessionId = useChatStore((s) => s.currentSessionId);
  const isHistoricalTrack = useChatStore((s) => s.isHistoricalTrack);
  const messages = useChatStore((s) => s.messages);
  const queryClient = useQueryClient();
  const hasSyncedSessionRef = useRef(null);

  const handleSessionCreated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
  }, [queryClient]);

  const {
    sendMessage,
    connectToTaskStream,
    stopStream,
    isLoading: isSending,
  } = useAgentChat({
    onSessionCreated: handleSessionCreated,
  });

  const {
    data: sessionDetail,
    isLoading: isLoadingDetail,
  } = useConversationDetail(isHistoricalTrack ? currentSessionId : null);

  useEffect(() => {
    if (!sessionDetail?.id || sessionDetail.id === hasSyncedSessionRef.current) return;

    if (useChatStore.getState().isHistoricalTrack) {
      useChatStore.getState().setMessages(sessionDetail.messages || []);
      useChatStore.getState().setHasMore(!!sessionDetail.hasMore);

      const lastMsg = sessionDetail.messages?.[sessionDetail.messages.length - 1];
      if (lastMsg?.taskStatus === 'RUNNING' && lastMsg?.taskId) {
        const assistantId = lastMsg.role === 'assistant' ? lastMsg.id : undefined;
        connectToTaskStream(lastMsg.taskId, assistantId);
      }
    }

    hasSyncedSessionRef.current = sessionDetail.id;
  }, [sessionDetail, connectToTaskStream]);

  useEffect(() => {
    if (!currentSessionId) hasSyncedSessionRef.current = null;
  }, [currentSessionId]);

  const handleSend = useCallback((content) => {
    sendMessage(content, {
      sessionId: useChatStore.getState().currentSessionId || undefined,
    });
  }, [sendMessage]);

  const hasMessages = messages.length > 0;
  const showSkeleton = isLoadingDetail && !hasMessages;
  const showWelcome = !currentSessionId && !hasMessages && !isLoadingDetail;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
      {(currentSessionId || hasMessages) && (
        <div className="flex h-12 shrink-0 items-center border-b border-border/40 px-6">
          <h3 className="truncate text-[13px] font-medium text-foreground/70">
            {sessionDetail?.title || (currentSessionId ? 'Conversation' : 'New Conversation')}
          </h3>
        </div>
      )}

      {showSkeleton ? (
        <ChatSkeleton />
      ) : showWelcome ? (
        <WelcomeState onSuggestion={handleSend} />
      ) : (
        <ChatMain className="min-h-0 flex-1" />
      )}

      <ChatInput
        onSend={handleSend}
        isLoading={isSending}
        onStop={stopStream}
      />
    </div>
  );
}
