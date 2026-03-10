import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';
import { Loader2 } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useWorkflowRuntimeStore } from '@/stores/workflowRuntimeStore';
import { apiClient } from '@/http/client';
import { cn } from '@/lib/utils';
import { MessageRow } from './MessageRow';
import { TypingIndicator } from './TypingIndicator';

interface ChatMainProps {
  className?: string;
  onInteractionSubmit?: (payload: { actionId: string; formData: Record<string, string> }) => void;
}

export function ChatMain({ className, onInteractionSubmit }: ChatMainProps) {
  const messages = useChatStore((s) => s.messages);
  const isTyping = useChatStore((s) => s.isTyping);
  const hasMore = useChatStore((s) => s.hasMore);
  const isLoadingMore = useChatStore((s) => s.isLoadingMore);
  const selectedMessageId = useWorkflowRuntimeStore((s) => s.selectedMessageId);

  const endRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const pendingAnchorRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
  const lastMessage = messages[messages.length - 1];

  useEffect(() => {
    if (!isLoadingMore) {
      endRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages.length, isTyping, lastMessage?.content, isLoadingMore]);

  useLayoutEffect(() => {
    const anchor = pendingAnchorRef.current;
    if (!anchor) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const newScrollHeight = container.scrollHeight;
    container.scrollTop = anchor.scrollTop + (newScrollHeight - anchor.scrollHeight);
    pendingAnchorRef.current = null;
  }, [messages]);

  useEffect(() => {
    if (!selectedMessageId) return;
    const target = document.getElementById(`message-${selectedMessageId}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selectedMessageId]);

  const loadOlderMessages = useCallback(async () => {
    const {
      messages: currentMessages,
      currentSessionId,
      prependMessages,
      setHasMore,
      setIsLoadingMore,
    } = useChatStore.getState();

    if (!currentSessionId || !currentMessages.length) return;

    setIsLoadingMore(true);

    try {
      const firstMsgId = currentMessages[0].id;
      const res = await apiClient.get(`/sessions/${currentSessionId}`, {
        params: { before: firstMsgId },
      });
      const data = res?.data ?? res;
      const olderMessages = data?.messages ?? [];

      setHasMore(data?.hasMore ?? false);

      if (olderMessages.length > 0) {
        const container = scrollContainerRef.current;
        if (container) {
          pendingAnchorRef.current = {
            scrollHeight: container.scrollHeight,
            scrollTop: container.scrollTop,
          };
        }
        prependMessages(olderMessages);
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const { hasMore: canLoad, isLoadingMore: loading } = useChatStore.getState();
        if (canLoad && !loading) loadOlderMessages();
      },
      { root: container, threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadOlderMessages]);

  const handleInteractionSubmit = useCallback((payload: { actionId: string; formData: Record<string, string> }) => {
    onInteractionSubmit?.(payload);
  }, [onInteractionSubmit]);

  return (
    <div
      ref={scrollContainerRef}
      className={cn('flex flex-1 flex-col overflow-y-auto', className)}
      style={{ overflowAnchor: 'none' }}
    >
      <div className="mx-auto w-full max-w-3xl py-6">
        {hasMore && (
          <div ref={topSentinelRef} className="flex justify-center py-3">
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-muted-foreground/50">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">Loading older messages...</span>
              </div>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <MessageRow
            key={msg.id}
            msg={msg}
            onInteractionSubmit={handleInteractionSubmit}
          />
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={endRef} aria-hidden="true" />
      </div>
    </div>
  );
}
