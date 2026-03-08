import { cn } from '@/lib/utils';
import { TIMELINE_ICONS } from './config';
import { formatClock } from './formatters';

export function ExecutionTimeline({
  steps,
  selectedStepId,
  onSelectStep,
}) {
  return (
    <div className="min-h-0 overflow-y-auto px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
            Execution log
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Click any step to inspect it and sync the linked message.
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {steps.map((step, index) => {
          const StepIcon = TIMELINE_ICONS[step.kind] || TIMELINE_ICONS.system;
          const isActive = selectedStepId === step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelectStep(step.id)}
              className={cn(
                'w-full rounded-2xl border px-3 py-3 text-left transition-all',
                isActive
                  ? 'border-slate-950 bg-slate-950 text-white shadow-[0_18px_44px_-34px_rgba(15,23,42,0.75)]'
                  : 'border-slate-200/80 bg-white/86 text-slate-700 hover:border-slate-300 hover:bg-white',
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border',
                  isActive
                    ? 'border-white/16 bg-white/10 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-600',
                )}
                >
                  <StepIcon size={15} strokeWidth={1.8} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium">
                      {step.title}
                    </p>
                    <span className={cn(
                      'rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em]',
                      isActive
                        ? 'bg-white/12 text-white/80'
                        : 'bg-slate-100 text-slate-500',
                    )}
                    >
                      {step.status}
                    </span>
                  </div>

                  <p className={cn(
                    'mt-1 text-xs leading-5',
                    isActive ? 'text-white/72' : 'text-slate-500',
                  )}
                  >
                    {step.detail}
                  </p>

                  <div className={cn(
                    'mt-2 flex items-center gap-2 text-[11px]',
                    isActive ? 'text-white/60' : 'text-slate-400',
                  )}
                  >
                    <span>
                      0
                      {index + 1}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-current" />
                    <span>{formatClock(step.startedAt)}</span>
                    {step.messageId && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-current" />
                        <span>Linked message</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
