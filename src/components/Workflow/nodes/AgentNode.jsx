import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Bot,
  GitBranch,
  MessageSquareQuote,
  ScanSearch,
  Sparkles,
  Wrench,
  ArrowUpRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_CONFIG = {
  analysis: {
    icon: ScanSearch,
    iconClass: 'text-sky-700',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  plan: {
    icon: GitBranch,
    iconClass: 'text-slate-700',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  tool: {
    icon: Wrench,
    iconClass: 'text-amber-700',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  decision: {
    icon: Sparkles,
    iconClass: 'text-violet-700',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  handoff: {
    icon: MessageSquareQuote,
    iconClass: 'text-amber-700',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  response: {
    icon: ArrowUpRight,
    iconClass: 'text-emerald-700',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  model: {
    icon: Bot,
    iconClass: 'text-slate-900',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

const STATUS_STYLES = {
  idle: 'border-slate-200 bg-white/88 shadow-[0_14px_40px_-34px_rgba(15,23,42,0.25)]',
  running: 'border-slate-950 bg-slate-950 text-white shadow-[0_24px_56px_-32px_rgba(15,23,42,0.7)]',
  paused: 'border-amber-300 bg-amber-50 text-amber-950 shadow-[0_22px_48px_-34px_rgba(217,119,6,0.36)]',
  completed: 'border-emerald-300 bg-emerald-50 text-emerald-950 shadow-[0_22px_48px_-34px_rgba(5,150,105,0.36)]',
  success: 'border-slate-300 bg-white text-slate-900 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.3)]',
  error: 'border-red-300 bg-red-50 text-red-950 shadow-[0_22px_48px_-34px_rgba(220,38,38,0.32)]',
};

function StatusIcon({ status, typeIcon: TypeIcon, typeIconClass }) {
  if (status === 'running') {
    return <Loader2 size={17} className="animate-spin text-white" />;
  }

  if (status === 'completed' || status === 'success') {
    return <CheckCircle2 size={17} className="text-emerald-700" />;
  }

  if (status === 'error') {
    return <AlertTriangle size={17} className="text-red-700" />;
  }

  return <TypeIcon size={17} className={typeIconClass} />;
}

/**
 * @param {{ data?: {
 *   label?: string,
 *   subtitle?: string,
 *   detail?: string,
 *   type?: keyof typeof TYPE_CONFIG,
 *   status?: keyof typeof STATUS_STYLES,
 *   isSelected?: boolean,
 *   isCurrent?: boolean,
 *   activityCount?: number,
 * } }} props
 */
function AgentNodeInner({ data }) {
  const {
    label = 'Untitled',
    subtitle = 'Execution stage',
    detail = '',
    type = 'analysis',
    status = 'idle',
    isSelected = false,
    isCurrent = false,
    activityCount = 0,
  } = data ?? {};

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.analysis;
  const TypeIcon = config.icon;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="h-2.5 w-2.5 border-2 border-white bg-slate-300"
      />

      <div
        className={cn(
          'relative w-[190px] overflow-hidden rounded-[26px] border p-4 transition-all duration-300',
          STATUS_STYLES[status] || STATUS_STYLES.idle,
          isSelected && 'ring-2 ring-slate-950/14',
          isCurrent && status === 'running' && 'animate-pulse',
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_55%)]" />

        <div className="relative flex items-start justify-between gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-2xl border bg-white/76',
              status === 'running'
                ? 'border-white/12 bg-white/8'
                : config.badgeClass,
            )}
          >
            <StatusIcon
              status={status}
              typeIcon={TypeIcon}
              typeIconClass={config.iconClass}
            />
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className={cn(
              'rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em]',
              status === 'running'
                ? 'border-white/12 bg-white/10 text-white/75'
                : 'border-black/6 bg-white/70 text-slate-500',
            )}
            >
              {subtitle}
            </span>
            {activityCount > 0 && (
              <span className={cn(
                'rounded-full px-2 py-1 text-[10px] font-medium',
                status === 'running'
                  ? 'bg-white/10 text-white/70'
                  : 'bg-slate-100 text-slate-500',
              )}
              >
                {activityCount}
                {' '}
                events
              </span>
            )}
          </div>
        </div>

        <div className="relative mt-4">
          <p className={cn(
            'text-sm font-semibold tracking-tight',
            status === 'running' ? 'text-white' : 'text-slate-950',
          )}
          >
            {label}
          </p>
          <p className={cn(
            'mt-1 text-[12px] leading-5',
            status === 'running'
              ? 'text-white/68'
              : status === 'paused'
                ? 'text-amber-800/80'
                : 'text-slate-500',
          )}
          >
            {detail}
          </p>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="h-2.5 w-2.5 border-2 border-white bg-slate-300"
      />
    </>
  );
}

export const AgentNode = memo(AgentNodeInner);
AgentNode.displayName = 'AgentNode';
