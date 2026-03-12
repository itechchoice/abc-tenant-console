import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';
import { Loader2 } from 'lucide-react';
import {
  useChatStore,
  selectCurrentMessages,
  selectIsTyping,
  selectHasMore,
  selectIsLoadingMore,
  selectActiveSessionId,
} from '@/stores/chatStore';
import { useWorkflowRuntimeStore } from '@/stores/workflowRuntimeStore';
import { fetchOlderMessages } from '@/http/chatApi';
import { cn } from '@/lib/utils';
import { MessageRow } from './MessageRow';
import { TypingIndicator } from './TypingIndicator';

interface ChatMainProps {
  className?: string;
  onInteractionSubmit?: (payload: { actionId: string; formData: Record<string, string> }) => void;
  onNodeClick?: (nodeId: string) => void;
}

export function ChatMain({ className, onInteractionSubmit, onNodeClick }: ChatMainProps) {
  const messages = useChatStore(selectCurrentMessages);
  const isTyping = useChatStore(selectIsTyping);
  const hasMore = useChatStore(selectHasMore);
  const isLoadingMore = useChatStore(selectIsLoadingMore);
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
    const store = useChatStore.getState();
    const sessionId = selectActiveSessionId(store);
    const session = store.sessions.get(sessionId);
    if (!session || !store.currentSessionId || session.messageOrder.length === 0) return;

    store.setIsLoadingMore(sessionId, true);

    try {
      const firstMsgId = session.messageOrder[0];
      const result = await fetchOlderMessages(store.currentSessionId, firstMsgId);

      store.setHasMore(sessionId, result.hasMore);

      if (result.messages.length > 0) {
        const container = scrollContainerRef.current;
        if (container) {
          pendingAnchorRef.current = {
            scrollHeight: container.scrollHeight,
            scrollTop: container.scrollTop,
          };
        }
        store.prependMessages(sessionId, result.messages);
      }
    } catch {
      store.setHasMore(sessionId, false);
    } finally {
      store.setIsLoadingMore(sessionId, false);
    }
  }, []);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const store = useChatStore.getState();
        const sid = selectActiveSessionId(store);
        const session = store.sessions.get(sid);
        if (session?.hasMore && !session.isLoadingMore) loadOlderMessages();
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
      <div className="w-full px-6 md:px-12 lg:px-20 py-6">
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
            onNodeClick={onNodeClick}
          />
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={endRef} aria-hidden="true" />
      </div>
    </div>
  );
}
