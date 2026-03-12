import {
  useState, useRef, useEffect, useCallback, useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch, Search, Check, Loader2,
} from 'lucide-react';
import { usePublishedWorkflows } from '@/hooks/useChatCapabilities';
import { cn } from '@/lib/utils';
import type { SelectedWorkflow } from './ChatPanel/capabilityTypes';

interface WorkflowPickerProps {
  selected: SelectedWorkflow | null;
  onChange: (next: SelectedWorkflow | null) => void;
}

export default function WorkflowPicker({ selected, onChange }: WorkflowPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: workflows = [], isLoading } = usePublishedWorkflows();

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return workflows;
    const q = search.toLowerCase();
    return workflows.filter(
      (wf) => wf.name.toLowerCase().includes(q) || wf.description?.toLowerCase().includes(q),
    );
  }, [workflows, search]);

  const handleSelect = useCallback((wf: { id: string; name: string }) => {
    if (selected?.id === wf.id) {
      onChange(null);
    } else {
      onChange({ id: wf.id, name: wf.name });
    }
  }, [selected, onChange]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1 rounded py-0.5 px-1.5',
          'text-xs text-muted-foreground/70 transition-colors',
          'hover:text-foreground/80',
          selected && 'text-primary hover:text-primary/80',
        )}
      >
        <GitBranch size={12} />
        <span className="max-w-[100px] truncate">
          {selected ? selected.name : 'Workflow'}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className={cn(
              'absolute left-0 bottom-full z-50 mb-2 w-[260px]',
              'rounded-xl border border-border/60 bg-popover',
              'shadow-[0_-4px_24px_rgba(0,0,0,0.08)]',
            )}
          >
            <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
              <Search size={12} className="shrink-0 text-muted-foreground/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search workflows..."
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="max-h-[240px] overflow-y-auto p-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={16} className="animate-spin text-muted-foreground/40" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-4 text-center text-[11px] text-muted-foreground/40">
                  {search ? 'No matching workflows' : 'No published workflows'}
                </p>
              ) : (
                filtered.map((wf) => {
                  const isSelected = selected?.id === wf.id;
                  return (
                    <button
                      key={wf.id}
                      type="button"
                      onClick={() => handleSelect(wf)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors',
                        isSelected
                          ? 'bg-accent text-accent-foreground'
                          : 'text-foreground/70 hover:bg-accent/50',
                      )}
                    >
                      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                        <span className="text-xs font-medium truncate">{wf.name}</span>
                        {wf.description && (
                          <span className="text-[10px] text-muted-foreground/50 truncate">
                            {wf.description}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check size={13} className="shrink-0 text-primary" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
