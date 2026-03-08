import { Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODE_LABELS, STATUS_LABELS, STATUS_TONES } from './config';
import { formatDuration } from './formatters';

export function ExecutionHeader({
  chatMode,
  status,
  steps,
  followLive,
  onToggleFollow,
  selectedStep,
  summary,
}) {
  return (
    <div className="relative border-b border-slate-200/70 px-4 py-4">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,255,255,0.68))]" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {MODE_LABELS[chatMode]}
            </span>
            <span className={cn(
              'rounded-full border px-2.5 py-1 text-[11px] font-medium',
              STATUS_TONES[status],
            )}
            >
              {STATUS_LABELS[status]}
            </span>
          </div>

          <h3 className="mt-3 text-[15px] font-semibold tracking-tight text-slate-950">
            {selectedStep?.title || summary?.headline || 'Execution stage'}
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {selectedStep?.detail
              || (summary
                ? `${summary.stepCount} steps · ${summary.toolNames.length} tools · ${formatDuration(summary.durationMs)}`
                : 'The orchestration panel mirrors runtime events from the active chat.')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onToggleFollow(!followLive)}
          className={cn(
            'inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-medium transition-all',
            followLive
              ? 'border-slate-950 bg-slate-950 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
          )}
        >
          <Crosshair size={13} strokeWidth={1.8} />
          {followLive ? 'Following live' : 'Follow live'}
        </button>
      </div>

      <div className="relative mt-4 flex items-center gap-2 text-[11px] text-slate-500">
        <span className="font-medium text-slate-900">
          {steps.length}
        </span>
        logged steps
      </div>
    </div>
  );
}
