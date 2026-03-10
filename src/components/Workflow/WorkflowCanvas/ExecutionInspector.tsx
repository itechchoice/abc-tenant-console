import type {
  WorkflowExecutionSummary,
  WorkflowPanelPhase,
  WorkflowRuntimeStep,
} from '@/schemas/workflowRuntimeSchema';
import { formatClock, formatPayload } from './formatters';

interface ExecutionInspectorProps {
  step: WorkflowRuntimeStep | null;
  summary: WorkflowExecutionSummary | null;
  phase: WorkflowPanelPhase;
}

export function ExecutionInspector({
  step,
  summary,
  phase,
}: ExecutionInspectorProps) {
  const args = formatPayload(step?.args);
  const result = formatPayload(step?.result);

  return (
    <div className="border-t border-slate-200/70 bg-white/80 px-4 py-4">
      {step ? (
        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
                Inspector
              </p>
              <h4 className="mt-2 text-sm font-semibold text-slate-950">
                {step.title}
              </h4>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
              {step.status}
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {step.detail}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
            <span className="rounded-full border border-slate-200 px-2.5 py-1">
              Started
              {' '}
              {formatClock(step.startedAt)}
            </span>
            {step.endedAt && (
              <span className="rounded-full border border-slate-200 px-2.5 py-1">
                Finished
                {' '}
                {formatClock(step.endedAt)}
              </span>
            )}
            {step.toolName && (
              <span className="rounded-full border border-slate-200 px-2.5 py-1">
                {step.toolName}
              </span>
            )}
          </div>

          {(args || result || step.error) && (
            <div className="mt-4 grid gap-3">
              {args && (
                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    Arguments
                  </p>
                  <pre className="max-h-36 overflow-auto rounded-2xl border border-slate-200 bg-slate-950 px-3 py-3 text-[11px] leading-5 text-slate-200">
                    {args}
                  </pre>
                </div>
              )}

              {result && (
                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    Result
                  </p>
                  <pre className="max-h-36 overflow-auto rounded-2xl border border-slate-200 bg-slate-950 px-3 py-3 text-[11px] leading-5 text-slate-200">
                    {result}
                  </pre>
                </div>
              )}

              {step.error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-xs leading-5 text-red-700">
                  {step.error}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
            Summary
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {summary?.headline || 'No execution selected'}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {phase === 'review'
              ? 'Review the completed execution and reopen it later from Last run.'
              : 'Execution details will appear here as soon as the workflow starts.'}
          </p>
        </div>
      )}
    </div>
  );
}
