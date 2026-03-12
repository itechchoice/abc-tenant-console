import {
  useState, useRef, useEffect, useCallback, useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench, Search, ChevronRight, Check, Loader2,
} from 'lucide-react';
import { useMcpTools } from '@/hooks/useChatCapabilities';
import { cn } from '@/lib/utils';
import type { McpServerCatalog, McpServerTool } from '@/http/workflowApi';
import type { ToolSelection } from './ChatPanel/capabilityTypes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isServerSelected(selections: ToolSelection[], serverName: string) {
  return selections.some(
    (s) => s.type === 'all' || (s.type === 'server' && s.serverName === serverName),
  );
}

function isToolSelected(selections: ToolSelection[], serverName: string, toolName: string) {
  return selections.some(
    (s) => s.type === 'all'
      || (s.type === 'server' && s.serverName === serverName)
      || (s.type === 'tool' && s.serverName === serverName && s.toolName === toolName),
  );
}

function isAllSelected(selections: ToolSelection[]) {
  return selections.some((s) => s.type === 'all');
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ServerGroupProps {
  server: McpServerCatalog;
  tools: McpServerTool[];
  selections: ToolSelection[];
  onToggleServer: (server: McpServerCatalog) => void;
  onToggleTool: (server: McpServerCatalog, tool: McpServerTool) => void;
  defaultExpanded: boolean;
}

function ServerGroup({
  server, tools, selections, onToggleServer, onToggleTool, defaultExpanded,
}: ServerGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const serverChecked = isServerSelected(selections, server.name);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-accent/50 transition-colors"
      >
        <ChevronRight
          size={12}
          className={cn('shrink-0 text-muted-foreground/60 transition-transform duration-150', expanded && 'rotate-90')}
        />
        <span className="flex-1 truncate text-xs font-medium text-foreground/80">
          {server.name}
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleServer(server); }}
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
            serverChecked
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border/60 hover:border-foreground/30',
          )}
        >
          {serverChecked && <Check size={10} strokeWidth={3} />}
        </button>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="ml-5 border-l border-border/30 pl-2">
              {tools.map((tool) => {
                const checked = isToolSelected(selections, server.name, tool.name);
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => onToggleTool(server, tool)}
                    disabled={serverChecked}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
                      serverChecked ? 'opacity-50 cursor-default' : 'hover:bg-accent/40',
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="block truncate text-[11px] font-medium text-foreground/70">
                        {tool.name}
                      </span>
                      {tool.description && (
                        <span className="block truncate text-[10px] text-muted-foreground/50">
                          {tool.description}
                        </span>
                      )}
                    </div>
                    <div
                      className={cn(
                        'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors',
                        checked
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border/50',
                      )}
                    >
                      {checked && <Check size={8} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ToolsPicker
// ---------------------------------------------------------------------------

interface ToolsPickerProps {
  selections: ToolSelection[];
  onChange: (next: ToolSelection[]) => void;
}

export default function ToolsPicker({ selections, onChange }: ToolsPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: servers = [], isLoading } = useMcpTools();

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
    if (!search.trim()) return servers;
    const q = search.toLowerCase();
    return servers
      .map((s) => {
        const nameMatch = s.name.toLowerCase().includes(q);
        const matchedTools = (s.tools ?? []).filter(
          (t) => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q),
        );
        if (nameMatch) return s;
        if (matchedTools.length > 0) return { ...s, tools: matchedTools };
        return null;
      })
      .filter(Boolean) as McpServerCatalog[];
  }, [servers, search]);

  const allChecked = isAllSelected(selections);
  const selectedCount = allChecked
    ? servers.reduce((n, s) => n + (s.tools?.length ?? 0), 0)
    : selections.length;

  const handleToggleAll = useCallback(() => {
    onChange(allChecked ? [] : [{ type: 'all' }]);
  }, [allChecked, onChange]);

  const handleToggleServer = useCallback((server: McpServerCatalog) => {
    if (allChecked) return;
    const already = selections.some((s) => s.type === 'server' && s.serverName === server.name);
    if (already) {
      onChange(selections.filter((s) => !(s.type === 'server' && s.serverName === server.name)));
    } else {
      const withoutServerTools = selections.filter(
        (s) => !(s.type === 'tool' && s.serverName === server.name),
      );
      onChange([...withoutServerTools, {
        type: 'server', serverName: server.name, serverCode: server.serverCode, displayName: server.name,
      }]);
    }
  }, [allChecked, selections, onChange]);

  const handleToggleTool = useCallback((server: McpServerCatalog, tool: McpServerTool) => {
    if (allChecked) return;
    const already = selections.some(
      (s) => s.type === 'tool' && s.serverName === server.name && s.toolName === tool.name,
    );
    if (already) {
      onChange(selections.filter(
        (s) => !(s.type === 'tool' && s.serverName === server.name && s.toolName === tool.name),
      ));
    } else {
      onChange([...selections, {
        type: 'tool', serverName: server.name, serverCode: server.serverCode, toolName: tool.name, displayName: tool.name,
      }]);
    }
  }, [allChecked, selections, onChange]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1 rounded py-0.5 px-1.5',
          'text-xs text-muted-foreground/50 transition-colors',
          'hover:text-muted-foreground',
          selectedCount > 0 && 'text-primary/70 hover:text-primary',
        )}
      >
        <Wrench size={12} />
        <span>Tools</span>
        {selectedCount > 0 && (
          <span className="ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-medium text-primary">
            {allChecked ? '*' : selectedCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className={cn(
              'absolute left-0 bottom-full z-50 mb-2 w-[300px]',
              'rounded-xl border border-border/60 bg-popover',
              'shadow-[0_-4px_24px_rgba(0,0,0,0.08)]',
            )}
          >
            <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
              <Search size={12} className="shrink-0 text-muted-foreground/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tools..."
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="max-h-[280px] overflow-y-auto p-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={16} className="animate-spin text-muted-foreground/40" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-4 text-center text-[11px] text-muted-foreground/40">
                  {search ? 'No matching tools' : 'No tools available'}
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleToggleAll}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-accent/50 transition-colors"
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        allChecked
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border/60 hover:border-foreground/30',
                      )}
                    >
                      {allChecked && <Check size={10} strokeWidth={3} />}
                    </div>
                    <span className="text-xs font-semibold text-foreground/90">All Tools</span>
                  </button>

                  <div className="my-0.5 h-px bg-border/30" />

                  {filtered.map((server) => (
                    <ServerGroup
                      key={server.id}
                      server={server}
                      tools={server.tools ?? []}
                      selections={selections}
                      onToggleServer={handleToggleServer}
                      onToggleTool={handleToggleTool}
                      defaultExpanded={filtered.length <= 3}
                    />
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
