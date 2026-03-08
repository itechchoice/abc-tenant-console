import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';
import { STATUS_LABELS } from './config';
import { formatDuration } from './formatters';

export function EmptyCanvasState({ chatMode, lastSummary, onOpenLastRun }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.14),_transparent_48%)]" />
      <div className="absolute inset-x-6 top-12 h-px bg-[linear-gradient(90deg,transparent,rgba(15,23,42,0.08),transparent)]" />

      <div className="relative flex flex-1 flex-col justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 24 }}
          className="rounded-[28px] border border-white/70 bg-white/78 p-6 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.45)] backdrop-blur-xl"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-950 text-white">
              <BrainCircuit size={18} strokeWidth={1.7} />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">
                Live orchestration
              </p>
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                Agent execution will appear here
              </h3>
            </div>
          </div>

          <p className="max-w-[34ch] text-sm leading-6 text-slate-600">
            Keep this panel open while you chat. Multi-step reasoning, tool
            calls, and human checkpoints will animate into a live execution map.
          </p>

          <div className="mt-6 grid gap-3">
            {(chatMode === 'model'
              ? ['Prompt intake', 'Model inference', 'Response stream']
              : ['Understand request', 'Plan the route', 'Retrieve evidence'])
              .map((label, index) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-semibold text-slate-500">
                    0
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                </div>
              ))}
          </div>

          {lastSummary && (
            <button
              type="button"
              onClick={onOpenLastRun}
              className="mt-6 w-full rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-left transition-colors hover:border-slate-300 hover:bg-white"
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Last run
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {lastSummary.headline}
                  </p>
                  <p className="text-xs text-slate-500">
                    {lastSummary.stepCount}
                    {' '}
                    steps
                    {' '}
                    ·
                    {' '}
                    {lastSummary.toolNames.length}
                    {' '}
                    tools
                    {' '}
                    ·
                    {' '}
                    {formatDuration(lastSummary.durationMs)}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  {STATUS_LABELS[lastSummary.status]}
                </span>
              </div>
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
