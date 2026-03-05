import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, CheckCircle2, AlertTriangle, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Props typedef
// ---------------------------------------------------------------------------

/**
 * @typedef {'pending' | 'success' | 'error'} ToolCallStatus
 */

/**
 * @typedef {object} ToolCallCardProps
 * @property {string}  toolName – Canonical name of the invoked tool.
 * @property {object | string}  [args]   – Arguments forwarded to the tool.
 * @property {ToolCallStatus}   status   – Current execution lifecycle state.
 * @property {string | object}  [result] – Payload returned after execution.
 * @property {string}  [className] – Additional class names for the outer card.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely format an unknown value into a pretty-printed JSON string.
 * Falls back to the raw string representation when parsing / formatting
 * fails, so that the component **never** throws.
 *
 * @param {unknown} value
 * @returns {string}
 */
function formatPayload(value) {
  if (value === undefined || value === null) return '';

  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

// ---------------------------------------------------------------------------
// Status configuration map
// ---------------------------------------------------------------------------

const STATUS_CONFIG = {
  pending: {
    icon: Loader2,
    iconClass: 'animate-spin text-blue-500',
    label: 'Executing tool\u2026',
    ringClass: 'border-blue-200 dark:border-blue-900/40',
    bgClass: 'bg-blue-50/60 dark:bg-blue-950/20',
  },
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
    label: 'Tool executed successfully',
    ringClass: 'border-emerald-200 dark:border-emerald-900/40',
    bgClass: 'bg-emerald-50/50 dark:bg-emerald-950/20',
  },
  error: {
    icon: AlertTriangle,
    iconClass: 'text-red-500',
    label: 'Tool execution failed',
    ringClass: 'border-red-200 dark:border-red-900/40',
    bgClass: 'bg-red-50/50 dark:bg-red-950/20',
  },
};

// ---------------------------------------------------------------------------
// Motion variants
// ---------------------------------------------------------------------------

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 24 },
  },
};

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: { type: 'spring', stiffness: 200, damping: 26 },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// ---------------------------------------------------------------------------
// ToolCallCard
// ---------------------------------------------------------------------------

/**
 * Renders a compact execution card for a single LLM tool invocation.
 *
 * The card adapts its colour accent and icon to the current `status`,
 * and optionally exposes an accordion section for inspecting the raw
 * `args` / `result` payload.
 *
 * @param {ToolCallCardProps} props
 */
export function ToolCallCard({
  toolName,
  args,
  status = 'pending',
  result,
  className,
}) {
  const [expanded, setExpanded] = useState(false);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;

  const formattedArgs = useMemo(() => formatPayload(args), [args]);
  const formattedResult = useMemo(() => formatPayload(result), [result]);
  const hasPayload = !!(formattedArgs || formattedResult);

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'my-3 overflow-hidden rounded-lg border',
        config.ringClass,
        config.bgClass,
        className,
      )}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3">
        <StatusIcon size={18} className={cn('shrink-0', config.iconClass)} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {toolName}
          </p>
          <p className="text-xs text-muted-foreground">
            {config.label}
          </p>
        </div>

        {hasPayload && (
          <motion.button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            whileTap={{ scale: 0.92 }}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs',
              'text-muted-foreground transition-colors',
              'hover:bg-foreground/5 hover:text-foreground',
            )}
          >
            {expanded ? 'Hide' : 'Details'}
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="inline-flex"
            >
              <ChevronDown size={14} />
            </motion.span>
          </motion.button>
        )}
      </div>

      {/* ── Expandable payload section ────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {expanded && hasPayload && (
          <motion.div
            key="payload"
            variants={expandVariants}
            initial="collapsed"
            animate="expanded"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="border-t border-inherit px-4 py-3 text-xs">
              {formattedArgs && (
                <div className="mb-2">
                  <span className="mb-1 block font-semibold text-muted-foreground">
                    Parameters
                  </span>
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-foreground/4 p-3 font-mono leading-relaxed text-foreground/75">
                    {formattedArgs}
                  </pre>
                </div>
              )}

              {formattedResult && (
                <div>
                  <span className="mb-1 block font-semibold text-muted-foreground">
                    Result
                  </span>
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-foreground/4 p-3 font-mono leading-relaxed text-foreground/75">
                    {formattedResult}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
