import { MessageSquare } from 'lucide-react';

export function ConversationEmptyState() {
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
