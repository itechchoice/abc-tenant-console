import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPayload } from './formatPayload';
import { STATUS_CONFIG } from './statusConfig';

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

export function ToolCallCard({
  toolName,
  args,
  status = 'pending',
  result,
  className,
  isActive = false,
  onInspect,
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
        isActive && 'ring-2 ring-primary/25 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.4)]',
        className,
      )}
    >
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

        <div className="flex items-center gap-1.5">
          {onInspect && (
            <motion.button
              type="button"
              onClick={onInspect}
              whileTap={{ scale: 0.92 }}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs',
                'text-muted-foreground transition-colors',
                'hover:bg-foreground/5 hover:text-foreground',
                isActive && 'bg-foreground/6 text-foreground',
              )}
            >
              {isActive ? 'Linked' : 'Locate'}
            </motion.button>
          )}

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
      </div>

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
