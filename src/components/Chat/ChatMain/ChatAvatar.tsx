import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MessageRole } from '@/schemas/chatSchema';

interface ChatAvatarProps {
  author: MessageRole;
}

export function ChatAvatar({ author }: ChatAvatarProps) {
  const isUser = author === 'user';

  return (
    <div
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border',
        isUser
          ? 'border-primary/20 bg-primary/10 text-primary'
          : 'border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
      )}
    >
      {isUser ? <User size={14} /> : <Bot size={14} />}
    </div>
  );
}
