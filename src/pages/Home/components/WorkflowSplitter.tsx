import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowSplitterProps {
  onMouseDown: React.MouseEventHandler<HTMLButtonElement>;
  isDragging: boolean;
}

export function WorkflowSplitter({ onMouseDown, isDragging }: WorkflowSplitterProps) {
  return (
    <button
      type="button"
      aria-label="Resize workflow panel"
      onMouseDown={onMouseDown}
      className={cn(
        'relative z-50 flex w-1.5 shrink-0 cursor-col-resize items-center justify-center',
        'select-none transition-colors duration-150',
        isDragging
          ? 'bg-primary/25'
          : 'bg-transparent hover:bg-primary/15',
      )}
    >
      <div
        className={cn(
          'flex h-8 w-3.5 items-center justify-center rounded-full',
          'transition-all duration-150',
          isDragging
            ? 'bg-primary/20 text-primary/70 scale-110'
            : 'text-transparent hover:text-muted-foreground/40',
        )}
      >
        <GripVertical size={10} strokeWidth={2.5} />
      </div>
    </button>
  );
}
