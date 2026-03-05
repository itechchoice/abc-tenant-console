import {
  useState, useMemo, memo, useCallback,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, MessageSquare, Trash2, X,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConversations, chatQueryKeys } from '@/hooks/useChatHistory';
import { useChatStore } from '@/stores/chatStore';
import { apiClient } from '@/http/client';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Time-grouping utility
// ---------------------------------------------------------------------------

const DAY_MS = 86_400_000;

/**
 * @param {import('@/hooks/useChatHistory').ConversationSummary[]} conversations
 */
function groupByTime(conversations) {
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const yesterdayStart = todayStart - DAY_MS;
  const weekStart = todayStart - 7 * DAY_MS;
  const monthStart = todayStart - 30 * DAY_MS;

  /** @type {Record<string, import('@/hooks/useChatHistory').ConversationSummary[]>} */
  const buckets = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    'Previous 30 Days': [],
    Older: [],
  };

  conversations.forEach((conv) => {
    const t = conv.updatedAt || conv.createdAt || 0;
    if (t >= todayStart) buckets.Today.push(conv);
    else if (t >= yesterdayStart) buckets.Yesterday.push(conv);
    else if (t >= weekStart) buckets['Previous 7 Days'].push(conv);
    else if (t >= monthStart) buckets['Previous 30 Days'].push(conv);
    else buckets.Older.push(conv);
  });

  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

// ---------------------------------------------------------------------------
// Motion variants
// ---------------------------------------------------------------------------

const listVariants = {
  visible: {
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 28 },
  },
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

const SKELETON_WIDTHS = [72, 88, 64, 80, 56, 92, 68, 76];

function SidebarSkeleton() {
  return (
    <div className="flex flex-col px-2 py-3">
      <div className="mb-3 ml-3 h-2.5 w-12 rounded-sm bg-muted/40 animate-pulse" />
      {SKELETON_WIDTHS.slice(0, 4).map((w) => (
        <div
          key={`sk-a-${w}`}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5"
        >
          <div className="h-4 w-4 rounded bg-muted/50 animate-pulse shrink-0" />
          <div
            className="h-3 rounded-sm bg-muted/50 animate-pulse"
            style={{ width: `${w}%` }}
          />
        </div>
      ))}
      <div className="mt-4 mb-3 ml-3 h-2.5 w-16 rounded-sm bg-muted/40 animate-pulse" />
      {SKELETON_WIDTHS.slice(4).map((w) => (
        <div
          key={`sk-b-${w}`}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5"
        >
          <div className="h-4 w-4 rounded bg-muted/50 animate-pulse shrink-0" />
          <div
            className="h-3 rounded-sm bg-muted/50 animate-pulse"
            style={{ width: `${w}%` }}
          />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
        <MessageSquare size={18} className="text-muted-foreground/40" />
      </div>
      <p className="text-[13px] font-medium text-muted-foreground/70">No conversations yet</p>
      <p className="mt-1 text-xs text-muted-foreground/40">Start a new chat to begin</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConversationItem
// ---------------------------------------------------------------------------

const ConversationItem = memo(({
  conversation, isActive, onSelect, onDelete,
}) => {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <motion.button
      variants={itemVariants}
      layout="position"
      onClick={() => onSelect(conversation.id)}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      className={cn(
        'group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
      )}
    >
      <MessageSquare size={14} className="shrink-0 opacity-40" />
      <span className="flex-1 truncate">{conversation.title || 'Untitled'}</span>

      <AnimatePresence>
        {showDelete && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => { e.stopPropagation(); onDelete(conversation.id); }}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
            role="button"
            tabIndex={-1}
          >
            <Trash2 size={12} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
});
ConversationItem.displayName = 'ConversationItem';

// ---------------------------------------------------------------------------
// ConversationSidebar
// ---------------------------------------------------------------------------

export default function ConversationSidebar() {
  const [search, setSearch] = useState('');

  const { data: conversations = [], isLoading } = useConversations();
  const currentSessionId = useChatStore((s) => s.currentSessionId);
  const clearChat = useChatStore((s) => s.clearChat);
  const setCurrentSessionId = useChatStore((s) => s.setCurrentSessionId);

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/conversations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    },
  });

  const handleNewChat = useCallback(() => {
    clearChat();
  }, [clearChat]);

  const handleSelect = useCallback((id) => {
    if (id === useChatStore.getState().currentSessionId) return;
    useChatStore.getState().clearChat();
    setCurrentSessionId(id);
  }, [setCurrentSessionId]);

  const handleDelete = useCallback((id) => {
    deleteMutation.mutate(id);
    if (useChatStore.getState().currentSessionId === id) {
      clearChat();
    }
  }, [deleteMutation, clearChat]);

  // Search filtering
  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => c.title?.toLowerCase().includes(q));
  }, [conversations, search]);

  const grouped = useMemo(() => groupByTime(filtered), [filtered]);

  return (
    <aside className="flex w-80 shrink-0 flex-col border-r border-border bg-sidebar">
      {/* ── Header ─────────────────────────────────────────────────── */}
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

      {/* ── Search ─────────────────────────────────────────────────── */}
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

      {/* ── Conversation list ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {isLoading ? (
          <SidebarSkeleton />
        ) : conversations.length === 0 ? (
          <EmptyState />
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
                {group.items.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === currentSessionId}
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
