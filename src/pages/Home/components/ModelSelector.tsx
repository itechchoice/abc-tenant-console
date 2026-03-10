import {
  useState, useRef, useEffect, useCallback, memo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Loader2 } from 'lucide-react';
import { useAssignedModels } from '@/hooks/useModels';
import { useChatStore } from '@/stores/chatStore';
import { cn } from '@/lib/utils';
import type { AssignedProvider } from '@/schemas/modelSchema';

// ---------------------------------------------------------------------------
// Provider type badge
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  azure: 'Azure',
  custom: 'Custom',
};

// ---------------------------------------------------------------------------
// Dropdown item
// ---------------------------------------------------------------------------

interface ModelOptionProps {
  model: AssignedProvider;
  isSelected: boolean;
  onSelect: (model: AssignedProvider) => void;
}

const ModelOption = memo(({ model, isSelected, onSelect }: ModelOptionProps) => (
  <button
    type="button"
    onClick={() => onSelect(model)}
    className={cn(
      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left',
      'transition-colors',
      isSelected
        ? 'bg-accent text-accent-foreground'
        : 'text-foreground/70 hover:bg-accent/50',
    )}
  >
    <div className="flex flex-1 flex-col gap-0.5 min-w-0">
      <span className="text-xs font-medium truncate">{model.name}</span>
      <span className="text-[10px] text-muted-foreground/50">
        {TYPE_LABELS[model.type] || model.type}
      </span>
    </div>
    {isSelected && (
      <Check size={13} className="shrink-0 text-primary" />
    )}
  </button>
));
ModelOption.displayName = 'ModelOption';

// ---------------------------------------------------------------------------
// ModelSelector
// ---------------------------------------------------------------------------

/**
 * Inline text trigger + upward popover for selecting the active LLM provider.
 * Designed to sit inside the ChatInput bottom toolbar — opens **upward**.
 */
export default function ModelSelector() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: models = [], isLoading, isError } = useAssignedModels();
  const selectedModel = useChatStore((s) => s.selectedModel);
  const setSelectedModel = useChatStore((s) => s.setSelectedModel);

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

  const handleSelect = useCallback((model: AssignedProvider) => {
    setSelectedModel(model);
    setOpen(false);
  }, [setSelectedModel]);

  const disabled = isLoading || (isError && models.length === 0);
  const empty = !isLoading && !isError && models.length === 0;

  const label = isLoading
    ? 'Loading...'
    : isError
      ? 'Unavailable'
      : empty
        ? 'No models'
        : (selectedModel?.name || 'Select model');

  return (
    <div ref={containerRef} className="relative">
      {/* ── Trigger: plain inline text ────────────────────────────── */}
      <button
        type="button"
        disabled={disabled || empty}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-0.5 rounded py-0.5 px-1 -mx-1',
          'text-xs text-muted-foreground/50',
          'transition-colors hover:text-muted-foreground',
          'disabled:opacity-40 disabled:cursor-not-allowed',
        )}
      >
        {isLoading && (
          <Loader2 size={11} className="mr-0.5 animate-spin" />
        )}
        <span>{label}</span>
        <ChevronDown
          size={11}
          className={cn(
            'transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* ── Dropdown: opens upward ────────────────────────────────── */}
      <AnimatePresence>
        {open && models.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className={cn(
              'absolute right-0 bottom-full z-50 mb-2 min-w-[200px]',
              'rounded-xl border border-border/60 bg-popover p-1',
              'shadow-[0_-4px_24px_rgba(0,0,0,0.08)]',
            )}
          >
            {models.map((model) => (
              <ModelOption
                key={model.id}
                model={model}
                isSelected={selectedModel?.id === model.id}
                onSelect={handleSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
