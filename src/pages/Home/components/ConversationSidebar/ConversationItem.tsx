import { useState, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionItem } from '@/schemas/chatSchema';

interface ConversationItemProps {
  conversation: SessionItem;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
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
}: ConversationItemProps) => {
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
            onClick={(e) => {
              e.stopPropagation();
              onDelete(conversation.id);
            }}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
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
