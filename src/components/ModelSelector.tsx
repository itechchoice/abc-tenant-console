import {
  useState, useRef, useEffect, useCallback, memo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Loader2, Sparkles } from 'lucide-react';
import { useChatModels } from '@/hooks/useModels';
import { cn } from '@/lib/utils';
import type { ChatModel } from '@/http/modelManagerApi';

// ---------------------------------------------------------------------------
// Dropdown item
// ---------------------------------------------------------------------------

interface ModelOptionProps {
  model: ChatModel;
  isSelected: boolean;
  onSelect: (model: ChatModel) => void;
}

const ModelOption = memo(({ model, isSelected, onSelect }: ModelOptionProps) => (
  <button
    type="button"
    onClick={() => onSelect(model)}
    className={cn(
      'flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left',
      'transition-colors',
      isSelected
        ? 'bg-accent text-accent-foreground'
        : 'text-foreground/70 hover:bg-accent/50',
    )}
  >
    <span className="flex-1 min-w-0 text-xs font-medium truncate">{model.id}</span>
    {isSelected && (
      <Check size={13} className="shrink-0 text-primary" />
    )}
  </button>
));
ModelOption.displayName = 'ModelOption';

// ---------------------------------------------------------------------------
// ModelSelector (controlled)
// ---------------------------------------------------------------------------

interface ModelSelectorProps {
  value: ChatModel | null;
  onChange: (model: ChatModel | null) => void;
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: models = [], isLoading, isError } = useChatModels();

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

  const handleSelect = useCallback((model: ChatModel) => {
    onChange(model);
    setOpen(false);
  }, [onChange]);

  const handleSelectAuto = useCallback(() => {
    onChange(null);
    setOpen(false);
  }, [onChange]);

  const disabled = isLoading || (isError && models.length === 0);

  const label = isLoading
    ? 'Loading...'
    : isError
      ? 'Unavailable'
      : value
        ? value.id
        : 'Auto';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-1 rounded py-0.5 px-1.5',
          'text-xs text-muted-foreground/70 leading-[16px]',
          'transition-colors hover:text-foreground/80',
          'disabled:opacity-40 disabled:cursor-not-allowed',
        )}
      >
        {isLoading && (
          <Loader2 size={12} className="shrink-0 animate-spin" />
        )}
        {!isLoading && !value && (
          <Sparkles size={12} className="shrink-0 text-primary/60" />
        )}
        <span>{label}</span>
        <ChevronDown
          size={11}
          className={cn(
            'shrink-0 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className={cn(
              'absolute right-0 bottom-full z-50 mb-2 min-w-[220px]',
              'rounded-xl border border-border/60 bg-popover p-1',
              'shadow-[0_-4px_24px_rgba(0,0,0,0.08)]',
            )}
          >
            <button
              type="button"
              onClick={handleSelectAuto}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left',
                'transition-colors',
                !value
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground/70 hover:bg-accent/50',
              )}
            >
              <Sparkles size={13} className="shrink-0 text-primary/60" />
              <span className="flex-1 min-w-0 text-xs font-medium">Auto</span>
              {!value && (
                <Check size={13} className="shrink-0 text-primary" />
              )}
            </button>

            {models.length > 0 && (
              <>
                <div className="my-0.5 h-px bg-border/30" />
                {models.map((model) => (
                  <ModelOption
                    key={model.id}
                    model={model}
                    isSelected={value?.id === model.id}
                    onSelect={handleSelect}
                  />
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
