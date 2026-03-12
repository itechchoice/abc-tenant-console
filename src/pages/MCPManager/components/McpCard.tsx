import { motion } from 'framer-motion';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { McpServerWithConnection } from '../hooks/useMCPList';
import ActionMenu from './ActionMenu';

// ---------------------------------------------------------------------------
// Connect button — reflects userConnection.connectionStatus
// ---------------------------------------------------------------------------

type ConnectionStatus = 'ACTIVE' | 'DISABLED' | 'PENDING';

const CONNECTION_CONFIG: Record<ConnectionStatus, {
  label: string;
  icon?: React.ReactNode;
  className: string;
}> = {
  ACTIVE: {
    label: 'Connected',
    icon: <Check className="h-3 w-3" />,
    className: 'h-6 px-2.5 text-[11px] bg-emerald-500 hover:bg-emerald-600 text-white border-transparent',
  },
  DISABLED: {
    label: 'Disconnected',
    icon: <Minus className="h-3 w-3" />,
    className: 'h-6 px-2.5 text-[11px] bg-rose-500 hover:bg-rose-600 text-white border-transparent',
  },
  PENDING: {
    label: '···',
    className: 'h-6 px-2.5 text-[11px] bg-amber-400 hover:bg-amber-500 text-white border-transparent',
  },
};

function ConnectButton({
  connectionStatus,
  onClick,
}: {
  connectionStatus?: string;
  onClick: () => void;
}) {
  if (!connectionStatus) {
    return (
      <Button variant="outline" size="sm" className="h-6 px-2.5 text-[11px] text-slate-600" onClick={onClick}>
        Connect
      </Button>
    );
  }

  const config = CONNECTION_CONFIG[connectionStatus as ConnectionStatus];
  if (!config) {
    return (
      <Button variant="outline" size="sm" className="h-6 px-2.5 text-[11px] text-slate-600" onClick={onClick}>
        Connect
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" className={config.className} onClick={onClick}>
      {config.icon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ServerIcon({ icon, name }: { icon?: string; name: string }) {
  const fallback = (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg font-semibold text-slate-500">
      {name.charAt(0).toUpperCase()}
    </div>
  );

  if (!icon) return fallback;

  if (icon.startsWith('http') || icon.startsWith('data:') || icon.startsWith('blob:')) {
    return (
      <div className="relative h-12 w-12 shrink-0">
        <img
          src={icon}
          alt={name}
          className="h-12 w-12 rounded-xl object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            const sib = (e.target as HTMLImageElement).nextElementSibling;
            if (sib) sib.classList.remove('hidden');
          }}
        />
        <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-lg font-semibold text-slate-500">
          {name.charAt(0).toUpperCase()}
        </div>
      </div>
    );
  }

  // emoji / text icon
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
      {icon}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface McpCardProps {
  mcp: McpServerWithConnection;
  isUpdating?: boolean;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onSync: () => void;
  onConnect: () => void;
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export default function McpCard({
  mcp, isUpdating, onDetail, onEdit, onDelete, onPublish, onUnpublish, onSync, onConnect,
}: McpCardProps) {
  const isActive = mcp.status === 'ACTIVE';
  const needsAuth = mcp.authType !== 'NONE';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div
        className={cn(
          'relative flex flex-col gap-0 rounded-2xl border border-slate-200/80 bg-white h-[170px]',
          'transition-shadow duration-200 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]',
          isUpdating && 'pointer-events-none',
        )}
      >
        {isUpdating && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
            <Skeleton className="h-5 w-24 rounded" />
          </div>
        )}

        {/* ── Top row: icon + name/url + switch ───────────────────── */}
        <div className="flex items-start gap-3 px-4 pt-4 pb-3">
          <ServerIcon icon={mcp.icon} name={mcp.name} />

          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={onDetail}
              className="block w-full text-left"
            >
              <span className="flex items-center gap-1.5">
                <h3 className="truncate text-[15px] font-bold text-slate-900 leading-snug hover:underline">
                  {mcp.name}
                </h3>
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    isActive ? 'bg-emerald-500' : 'bg-slate-300',
                  )}
                />
              </span>
            </button>
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {mcp.endpoint || '\u00a0'}
            </p>
          </div>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="shrink-0 mt-0.5 inline-flex">
                  <Switch
                    checked={isActive}
                    onCheckedChange={(checked) => {
                      if (checked) onPublish();
                      else onUnpublish();
                    }}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] text-center text-xs">
                Enabling this button will display the service in the tools toolbar.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* ── Description — 1 line max ────────────────────────────── */}
        <div className="px-4 pb-2">
          <p className="text-sm text-slate-500 leading-snug line-clamp-1 overflow-hidden">
            {mcp.description || '\u00a0'}
          </p>
        </div>


        {/* ── Bottom row: publish + auth + menu ───────────────────── */}
        <div className="mt-auto flex items-center gap-1.5 border-t border-slate-100 px-4 py-3">
          {/* Publish / Unpublish — single action button */}
          {isActive ? (
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2.5 text-[11px] text-slate-600"
              onClick={onUnpublish}
            >
              Unpublish
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2.5 text-[11px] text-slate-600"
              onClick={onPublish}
            >
              Publish
            </Button>
          )}

          {/* Connect button — shown for all auth types except NONE */}
          {needsAuth && (
            <ConnectButton
              connectionStatus={mcp.userConnection?.connectionStatus}
              onClick={onConnect}
            />
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action menu — bottom right */}
          <ActionMenu
            onDetail={onDetail}
            onEdit={onEdit}
            onDelete={onDelete}
            onSync={onSync}
            onConnect={needsAuth ? onConnect : undefined}
          />
        </div>
      </div>
    </motion.div>
  );
}
