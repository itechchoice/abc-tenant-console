import { useState } from 'react';
import {
  Loader2, CheckCircle2, XCircle, SkipForward,
  Rocket, Flag, AlertOctagon, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CodeBlock } from '@/components/GenerativeUI/MarkdownMessage/CodeBlock';

export interface ExecutionEvent {
  id: string;
  eventType: string;
  timestamp: string;
  nodeId?: string;
  nodeType?: string;
  status?: string;
  payload: Record<string, unknown>;
  error?: string;
  reason?: string;
}

interface ExecutionTimelineProps {
  events: ExecutionEvent[];
  onNodeClick?: (nodeId: string) => void;
}

const EVENT_META: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
  spinning?: boolean;
}> = {
  TASK_CREATED: { icon: Rocket, color: 'text-blue-500', label: 'Task Created' },
  STEP_START: { icon: Loader2, color: 'text-blue-500', label: 'Running', spinning: true },
  'STEP_DONE:completed': { icon: CheckCircle2, color: 'text-emerald-500', label: 'Completed' },
  'STEP_DONE:skipped': { icon: SkipForward, color: 'text-amber-500', label: 'Skipped' },
  'STEP_DONE:failed': { icon: XCircle, color: 'text-destructive', label: 'Failed' },
  TASK_COMPLETED: { icon: Flag, color: 'text-emerald-500', label: 'Workflow Completed' },
  TASK_COMPLETE: { icon: Flag, color: 'text-emerald-500', label: 'Workflow Completed' },
  TASK_FAILED: { icon: AlertOctagon, color: 'text-destructive', label: 'Workflow Failed' },
  ERROR: { icon: XCircle, color: 'text-destructive', label: 'Error' },
};

function getEventMeta(evt: ExecutionEvent) {
  if (evt.eventType === 'STEP_DONE' && evt.status) {
    return EVENT_META[`STEP_DONE:${evt.status}`] ?? EVENT_META['STEP_DONE:completed'];
  }
  return EVENT_META[evt.eventType] ?? {
    icon: Rocket, color: 'text-muted-foreground', label: evt.eventType,
  };
}

function formatTime(ts: string) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', {
      hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch { return ts; }
}

function TimelineEntry({ evt, isLast, onNodeClick }: {
  evt: ExecutionEvent; isLast: boolean; onNodeClick?: (nodeId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = getEventMeta(evt);
  const Icon = meta.icon;
  const isNode = !!evt.nodeId;
  const hasDetails = Object.keys(evt.payload).length > 0 || evt.error || evt.reason;

  return (
    <div className="relative flex gap-3 pb-1">
      {!isLast && (
        <div className="absolute left-[11px] top-[24px] bottom-0 w-px bg-border/60" />
      )}

      <div className={cn(
        'relative z-10 flex h-[23px] w-[23px] shrink-0 items-center justify-center',
        'rounded-full border bg-background', meta.color,
      )}>
        <Icon className={cn('h-3.5 w-3.5', meta.spinning && 'animate-spin')} />
      </div>

      <div className="flex-1 min-w-0 pb-3">
        <div className="flex items-center gap-2 min-h-[23px]">
          {isNode ? (
            <button
              type="button"
              onClick={() => evt.nodeId && onNodeClick?.(evt.nodeId)}
              className="font-mono text-xs font-medium text-foreground/80 hover:text-primary transition-colors truncate"
            >
              {evt.nodeId}
            </button>
          ) : (
            <span className="text-xs font-medium text-foreground/70">{meta.label}</span>
          )}

          {evt.nodeType && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal shrink-0">
              {evt.nodeType}
            </Badge>
          )}

          {isNode && (
            <span className={cn('text-[10px] font-medium shrink-0', meta.color)}>
              {meta.label}
            </span>
          )}

          <span className="ml-auto text-[10px] text-muted-foreground/50 tabular-nums shrink-0">
            {formatTime(evt.timestamp)}
          </span>

          {hasDetails && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="p-0.5 rounded hover:bg-accent/50 transition-colors shrink-0"
            >
              <ChevronRight className={cn(
                'h-3 w-3 text-muted-foreground/40 transition-transform',
                expanded && 'rotate-90',
              )} />
            </button>
          )}
        </div>

        {evt.error && (
          <p className="mt-1 text-[11px] text-destructive">{evt.error}</p>
        )}
        {evt.reason && !evt.error && (
          <p className="mt-1 text-[11px] text-amber-600">{evt.reason}</p>
        )}

        {expanded && hasDetails && (
          <div className="mt-2 max-h-[280px] overflow-auto rounded-lg [&_>div]:my-0">
            <CodeBlock language="json" value={JSON.stringify(evt.payload, null, 2)} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExecutionTimeline({ events, onNodeClick }: ExecutionTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Run the current workflow definition for testing and debugging.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((evt, i) => (
        <TimelineEntry
          key={evt.id}
          evt={evt}
          isLast={i === events.length - 1}
          onNodeClick={onNodeClick}
        />
      ))}
    </div>
  );
}
