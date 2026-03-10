import {
  useCallback,
  useMemo,
  useState,
} from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSessions, chatQueryKeys } from '@/hooks/useChatHistory';
import { apiClient } from '@/http/client';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chatStore';
import { useWorkflowRuntimeStore } from '@/stores/workflowRuntimeStore';
import { ConversationEmptyState } from './ConversationEmptyState';
import { ConversationItem } from './ConversationItem';
import { SidebarSkeleton } from './SidebarSkeleton';
import { groupByTime } from './timeGrouping';

const listVariants = {
  visible: {
    transition: { staggerChildren: 0.04 },
  },
};

export default function ConversationSidebar() {
  const [search, setSearch] = useState('');
  const { data: conversations = [], isLoading } = useSessions();
  const currentSessionId = useChatStore((s) => s.currentSessionId);
  const clearChat = useChatStore((s) => s.clearChat);
  const setCurrentSessionId = useChatStore((s) => s.setCurrentSessionId);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.sessions });
    },
  });

  const handleNewChat = useCallback(() => {
    clearChat();
    useWorkflowRuntimeStore.getState().resetRuntime();
    useChatStore.getState().setHistoricalTrack(false);
  }, [clearChat]);

  const handleSelect = useCallback((id: string) => {
    if (id === useChatStore.getState().currentSessionId) return;
    useChatStore.getState().clearChat();
    useWorkflowRuntimeStore.getState().resetRuntime();
    setCurrentSessionId(id);
    useChatStore.getState().setHistoricalTrack(true);
  }, [setCurrentSessionId]);

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id);
    if (useChatStore.getState().currentSessionId === id) {
      clearChat();
      useWorkflowRuntimeStore.getState().resetRuntime();
    }
  }, [deleteMutation, clearChat]);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const query = search.toLowerCase();
    return conversations.filter(
      (conversation) => conversation.title?.toLowerCase().includes(query),
    );
  }, [conversations, search]);

  const grouped = useMemo(() => groupByTime(filtered), [filtered]);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border/40 bg-sidebar">
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          Conversations
        </h2>
        <button
          type="button"
          onClick={handleNewChat}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg transition-all',
            'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground',
            'active:scale-95',
          )}
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search
            size={13}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className={cn(
              'h-8 w-full rounded-lg border-0 bg-sidebar-accent pl-8 pr-8 text-xs',
              'text-sidebar-foreground placeholder:text-muted-foreground/40',
              'outline-none ring-1 ring-transparent transition-shadow',
              'focus:ring-ring/30 focus:shadow-sm',
            )}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {isLoading ? (
          <SidebarSkeleton />
        ) : conversations.length === 0 ? (
          <ConversationEmptyState />
        ) : grouped.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-muted-foreground/50">
            No results for &ldquo;
            {search}
            &rdquo;
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label} className="mb-1">
              <div className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/35">
                {group.label}
              </div>
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="visible"
              >
                {group.items.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === currentSessionId}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                  />
                ))}
              </motion.div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
