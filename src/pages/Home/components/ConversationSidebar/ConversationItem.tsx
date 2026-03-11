import {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
  type KeyboardEvent,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MessageSquare,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionItem } from '@/schemas/chatSchema';

interface ConversationItemProps {
  conversation: SessionItem;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 28 },
  },
};

export const ConversationItem = memo(({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: ConversationItemProps) => {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const commitRename = useCallback(() => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== conversation.title) {
      onRename(conversation.id, trimmed);
    }
    setIsEditing(false);
  }, [editTitle, conversation.id, conversation.title, onRename]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRename();
    } else if (e.key === 'Escape') {
      setEditTitle(conversation.title || '');
      setIsEditing(false);
    }
  }, [commitRename, conversation.title]);

  if (isEditing) {
    return (
      <motion.div
        variants={itemVariants}
        layout="position"
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5',
          'bg-accent text-accent-foreground',
        )}
      >
        <MessageSquare size={14} className="shrink-0 opacity-40" />
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleKeyDown}
          className="flex-1 truncate bg-transparent text-[13px] outline-none ring-0"
        />
      </motion.div>
    );
  }

  return (
    <motion.button
      variants={itemVariants}
      layout="position"
      onClick={() => onSelect(conversation.id)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
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
        {showActions && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.12 }}
            className="flex items-center gap-0.5"
          >
            <span
              onClick={(e) => {
                e.stopPropagation();
                setEditTitle(conversation.title || '');
                setIsEditing(true);
              }}
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-primary/10 hover:text-primary"
              role="button"
              tabIndex={-1}
            >
              <Pencil size={11} />
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conversation.id);
              }}
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
              role="button"
              tabIndex={-1}
            >
              <Trash2 size={12} />
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

ConversationItem.displayName = 'ConversationItem';
