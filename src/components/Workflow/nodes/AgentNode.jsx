import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Brain, Wrench, GitBranch, Loader2, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Data typedef
// ---------------------------------------------------------------------------

/**
 * Shape of the `data` object passed to this custom node by React Flow.
 *
 * @typedef {'llm' | 'tool' | 'condition'} AgentNodeType
 * @typedef {'idle' | 'running' | 'success' | 'error'} AgentNodeStatus
 *
 * @typedef {object} AgentNodeData
 * @property {string}          [label='Unnamed Node']
 * @property {AgentNodeType}   [type='llm']
 * @property {AgentNodeStatus} [status='idle']
 */

// ---------------------------------------------------------------------------
// Icon / colour configuration driven by `type` and `status`
// ---------------------------------------------------------------------------

const TYPE_CONFIG = {
  llm: { icon: Brain, accent: 'text-violet-500' },
  tool: { icon: Wrench, accent: 'text-amber-500' },
  condition: { icon: GitBranch, accent: 'text-sky-500' },
};

const STATUS_RING = {
  idle: '',
  running: 'ring-2 ring-blue-400/50 animate-pulse',
  success: 'ring-2 ring-emerald-400/60',
  error: 'ring-2 ring-red-400/60',
};

const STATUS_BORDER = {
  idle: 'border-zinc-200 dark:border-zinc-700',
  running: 'border-blue-300 dark:border-blue-600',
  success: 'border-emerald-300 dark:border-emerald-600',
  error: 'border-red-300 dark:border-red-600',
};

// ---------------------------------------------------------------------------
// AgentNode
// ---------------------------------------------------------------------------

/**
 * Custom React Flow node representing an AI agent pipeline step.
 *
 * Renders a compact card whose border colour, ring glow, and icon adapt
 * to the node's `type` (llm / tool / condition) and real-time execution
 * `status` (idle / running / success / error).
 *
 * **Registration example:**
 * ```js
 * import { AgentNode } from '@/components/Workflow/nodes/AgentNode';
 * const nodeTypes = { agent: AgentNode };
 * <ReactFlow nodeTypes={nodeTypes} ... />
 * ```
 *
 * @param {{ data: AgentNodeData }} props
 */
function AgentNodeInner({ data }) {
  const {
    label = 'Unnamed Node',
    type = 'llm',
    status = 'idle',
  } = data ?? {};

  const typeConf = TYPE_CONFIG[type] || TYPE_CONFIG.llm;
  const TypeIcon = typeConf.icon;

  return (
    <>
      {/* ── Input handle (top) ─────────────────────────────────────── */}
      <Handle
        type="target"
        position={Position.Top}
        className="h-2 w-2 rounded-full border-2 border-background bg-zinc-400"
      />

      {/* ── Card body ──────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex min-w-[160px] items-center gap-2.5 rounded-xl border',
          'bg-card px-3.5 py-2.5 shadow-sm transition-shadow',
          STATUS_BORDER[status],
          STATUS_RING[status],
        )}
      >
        {/* Type icon */}
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center',
            'rounded-lg bg-muted',
          )}
        >
          {status === 'running' ? (
            <Loader2
              size={16}
              className="animate-spin text-blue-500"
            />
          ) : (
            <TypeIcon size={16} className={typeConf.accent} />
          )}
        </div>

        {/* Label */}
        <span className="truncate text-xs font-medium text-foreground">
          {label}
        </span>

        {/* Status badge (top-right corner for terminal states) */}
        {status === 'success' && (
          <CheckCircle2
            size={14}
            className="ml-auto shrink-0 text-emerald-500"
          />
        )}
        {status === 'error' && (
          <AlertTriangle
            size={14}
            className="ml-auto shrink-0 text-red-500"
          />
        )}
      </div>

      {/* ── Output handle (bottom) ─────────────────────────────────── */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="h-2 w-2 rounded-full border-2 border-background bg-zinc-400"
      />
    </>
  );
}

export const AgentNode = memo(AgentNodeInner);
AgentNode.displayName = 'AgentNode';
