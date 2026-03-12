import { X, Wrench, GitBranch, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolSelection, SelectedWorkflow } from './capabilityTypes';
import { getToolSelectionLabel } from './capabilityTypes';

interface InputTagListProps {
  tools: ToolSelection[];
  workflow: SelectedWorkflow | null;
  onRemoveTool: (index: number) => void;
  onRemoveWorkflow: () => void;
}

export function InputTagList({
  tools, workflow, onRemoveTool, onRemoveWorkflow,
}: InputTagListProps) {
  if (tools.length === 0 && !workflow) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-5 pt-3 pb-1">
      {tools.map((sel, i) => (
        <span
          key={sel.type === 'all' ? '__all__' : sel.type === 'server' ? sel.serverName : `${sel.serverName}:${sel.toolName}`}
          className={cn(
            'inline-flex items-center gap-1 rounded-md border border-border/40 bg-muted/50',
            'px-2 py-0.5 text-[11px] font-medium text-foreground/70',
            'transition-colors hover:bg-muted',
          )}
        >
          {sel.type === 'all'
            ? <Sparkles size={10} className="text-primary/60" />
            : <Wrench size={10} className="text-muted-foreground/50" />}
          <span className="max-w-[120px] truncate">{getToolSelectionLabel(sel)}</span>
          <button
            type="button"
            onClick={() => onRemoveTool(i)}
            className="ml-0.5 rounded-sm p-0.5 text-muted-foreground/40 hover:text-foreground/70 transition-colors"
          >
            <X size={10} />
          </button>
        </span>
      ))}

      {workflow && (
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md border border-border/40 bg-muted/50',
            'px-2 py-0.5 text-[11px] font-medium text-foreground/70',
            'transition-colors hover:bg-muted',
          )}
        >
          <GitBranch size={10} className="text-muted-foreground/50" />
          <span className="max-w-[120px] truncate">{workflow.name}</span>
          <button
            type="button"
            onClick={onRemoveWorkflow}
            className="ml-0.5 rounded-sm p-0.5 text-muted-foreground/40 hover:text-foreground/70 transition-colors"
          >
            <X size={10} />
          </button>
        </span>
      )}
    </div>
  );
}
