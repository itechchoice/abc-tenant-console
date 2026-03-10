import {
  useState, useRef, useEffect, useCallback, memo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Check, Search, Bot,
} from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Mock agent catalogue (replace with useQuery + real API when available)
// ---------------------------------------------------------------------------

interface AgentDef {
  id: string;
  name: string;
  description: string;
}

const PRESET_AGENTS: AgentDef[] = [
  { id: 'default', name: 'Default Agent', description: 'General-purpose assistant' },
  { id: 'coder', name: 'Code Assistant', description: 'Programming & debugging' },
  { id: 'analyst', name: 'Data Analyst', description: 'Charts, SQL & insights' },
];

// ---------------------------------------------------------------------------
// AgentOption
// ---------------------------------------------------------------------------

interface AgentOptionProps {
  agent: AgentDef;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const AgentOption = memo(({ agent, isSelected, onSelect }: AgentOptionProps) => (
  <button
    type="button"
    onClick={() => onSelect(agent.id)}
    className={cn(
      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left',
      'transition-colors',
      isSelected
        ? 'bg-accent text-accent-foreground'
        : 'text-foreground/70 hover:bg-accent/50',
    )}
  >
    <div className="flex flex-1 flex-col gap-0.5 min-w-0">
      <span className="text-xs font-medium truncate">{agent.name}</span>
      <span className="text-[10px] text-muted-foreground/50 truncate">
        {agent.description}
      </span>
    </div>
    {isSelected && (
      <Check size={13} className="shrink-0 text-primary" />
    )}
  </button>
));
AgentOption.displayName = 'AgentOption';

// ---------------------------------------------------------------------------
// AgentSelector
// ---------------------------------------------------------------------------

/**
 * Inline text trigger + upward popover with search for selecting an Agent ID.
 * Mirrors the `ModelSelector` visual pattern. Opens **upward**.
 *
 * The search field doubles as a free-form agent ID input — users can pick
 * from the preset list or type any custom agent ID and hit Enter.
 */
export default function AgentSelector() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedAgentId = useChatStore((s) => s.selectedAgentId);
  const setSelectedAgentId = useChatStore((s) => s.setSelectedAgentId);

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

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setSearch('');
    }
  }, [open]);

  const handleSelect = useCallback((id: string) => {
    setSelectedAgentId(id);
    setOpen(false);
  }, [setSelectedAgentId]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      handleSelect(search.trim());
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  }, [search, handleSelect]);

  const filtered = search.trim()
    ? PRESET_AGENTS.filter((a) => a.name.toLowerCase().includes(search.toLowerCase())
        || a.id.toLowerCase().includes(search.toLowerCase()))
    : PRESET_AGENTS;

  const isCustomId = search.trim()
    && !PRESET_AGENTS.some((a) => a.id === search.trim());

  const selectedAgent = PRESET_AGENTS.find((a) => a.id === selectedAgentId);
  const displayLabel = selectedAgent?.name || selectedAgentId || 'Select agent';

  return (
    <div ref={containerRef} className="relative">
      {/* ── Trigger ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-0.5 rounded py-0.5 px-1 -mx-1',
          'text-xs text-muted-foreground/50',
          'transition-colors hover:text-muted-foreground',
        )}
      >
        <Bot size={11} className="mr-0.5 shrink-0" />
        <span className="max-w-[120px] truncate">{displayLabel}</span>
        <ChevronDown
          size={11}
          className={cn(
            'transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* ── Popover: opens upward ────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className={cn(
              'absolute right-0 bottom-full z-50 mb-2 w-[240px]',
              'rounded-xl border border-border/60 bg-popover',
              'shadow-[0_-4px_24px_rgba(0,0,0,0.08)]',
            )}
          >
            {/* Search input */}
            <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
              <Search size={12} className="shrink-0 text-muted-foreground/40" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search or enter ID..."
                className={cn(
                  'flex-1 bg-transparent text-xs outline-none',
                  'text-foreground placeholder:text-muted-foreground/35',
                )}
              />
            </div>

            {/* Agent list */}
            <div className="max-h-[180px] overflow-y-auto p-1">
              {filtered.map((agent) => (
                <AgentOption
                  key={agent.id}
                  agent={agent}
                  isSelected={selectedAgentId === agent.id}
                  onSelect={handleSelect}
                />
              ))}

              {isCustomId && (
                <button
                  type="button"
                  onClick={() => handleSelect(search.trim())}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left',
                    'text-foreground/70 hover:bg-accent/50 transition-colors',
                  )}
                >
                  <Bot size={12} className="shrink-0 text-muted-foreground/40" />
                  <span className="text-xs">
                    Use &ldquo;
                    <span className="font-medium text-foreground">{search.trim()}</span>
                    &rdquo;
                  </span>
                </button>
              )}

              {filtered.length === 0 && !isCustomId && (
                <p className="px-3 py-4 text-center text-[11px] text-muted-foreground/40">
                  No matching agents
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
