import {
  useState, useCallback, useRef, useEffect,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelRightClose, PanelRight } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useWorkflowRuntimeStore } from '@/stores/workflowRuntimeStore';
import { WorkflowCanvas } from '@/components/Workflow/WorkflowCanvas';
import { cn } from '@/lib/utils';
import ConversationSidebar from './components/ConversationSidebar';
import ChatPanel from './components/ChatPanel';
import { WorkflowSplitter } from './components/WorkflowSplitter';

// ---------------------------------------------------------------------------
// Panel width constraints
// ---------------------------------------------------------------------------

const MIN_PANEL_WIDTH = 320;
const DEFAULT_RATIO = 0.3;
const MAX_RATIO = 0.6;
const STORAGE_KEY = 'workflow-panel-width';

/** @returns {number} */
function getMaxWidth() {
  return Math.round(window.innerWidth * MAX_RATIO);
}

/**
 * Reads cached panel width from localStorage with defensive parsing.
 * Falls back to 30% of viewport if the cache is missing or corrupt.
 * @returns {number}
 */
function getInitialWidth() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached !== null) {
      const parsed = Number(cached);
      if (Number.isFinite(parsed) && parsed > 0) {
        return Math.max(MIN_PANEL_WIDTH, Math.min(parsed, getMaxWidth()));
      }
    }
  } catch { /* localStorage may be blocked — fall through */ }
  return Math.round(window.innerWidth * DEFAULT_RATIO);
}

/**
 * Home — AI Console main workspace.
 *
 * Three-column split-screen layout:
 *   1. Left   – ConversationSidebar  (w-64, fixed session history)
 *   2. Center – ChatPanel            (flex-1, streaming chat interface)
 *   3. Right  – WorkflowCanvas       (resizable, collapsible agent execution graph)
 *
 * The right panel auto-expands when the backend emits a `workflow_pending`
 * event (via `currentWorkflowId` in the store), and can be manually toggled
 * by the user at any time. A draggable splitter allows free width adjustment.
 */
function Home() {
  const currentWorkflowId = useChatStore((s) => s.currentWorkflowId);
  const workflowPhase = useWorkflowRuntimeStore((s) => s.phase);
  const [canvasVisible, setCanvasVisible] = useState(true);
  const [panelWidth, setPanelWidth] = useState(getInitialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [fitViewTrigger, setFitViewTrigger] = useState(0);

  const draggingRef = useRef(false);
  const hadActiveExecutionRef = useRef(false);

  const toggleCanvas = useCallback(() => setCanvasVisible((v) => !v), []);

  const hasActiveExecution = !!currentWorkflowId || workflowPhase !== 'idle';
  const showCanvas = canvasVisible;

  useEffect(() => {
    if (hasActiveExecution && !hadActiveExecutionRef.current) {
      setCanvasVisible(true);
    }

    hadActiveExecutionRef.current = hasActiveExecution;
  }, [hasActiveExecution]);

  // ── Keep MAX_WIDTH in sync on window resize ──────────────────────
  useEffect(() => {
    const handleResize = () => {
      setPanelWidth((prev) => Math.min(prev, getMaxWidth()));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Drag handlers ────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    draggingRef.current = true;
    setIsDragging(true);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const handleMouseMove = (/** @type {MouseEvent} */ moveEvent) => {
      if (!draggingRef.current) return;
      const newWidth = window.innerWidth - moveEvent.clientX;
      const clamped = Math.max(MIN_PANEL_WIDTH, Math.min(newWidth, getMaxWidth()));
      setPanelWidth(clamped);
    };

    const handleMouseUp = () => {
      draggingRef.current = false;
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      setPanelWidth((final) => {
        try { localStorage.setItem(STORAGE_KEY, String(final)); } catch { /* noop */ }
        return final;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      {/* ── Left: Session sidebar ──────────────────────────────────── */}
      <ConversationSidebar />

      {/* ── Center: Chat panel ─────────────────────────────────────── */}
      <div className="relative flex flex-1 flex-col min-w-0 min-h-0 bg-background">
        <ChatPanel />

        <button
          type="button"
          onClick={toggleCanvas}
          aria-label={showCanvas ? 'Hide workflow canvas' : 'Show workflow canvas'}
          className={cn(
            'absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-lg',
            'bg-background/80 backdrop-blur-sm border border-border/60 shadow-sm',
            'text-muted-foreground hover:text-foreground hover:border-border',
            'transition-all active:scale-95',
          )}
        >
          {showCanvas
            ? <PanelRightClose size={14} strokeWidth={1.8} />
            : <PanelRight size={14} strokeWidth={1.8} />}
        </button>
      </div>

      {/* ── Splitter + Right: Workflow canvas ──────────────────────── */}
      <AnimatePresence initial={false}>
        {showCanvas && (
          <motion.div
            key="workflow-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: panelWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={
              isDragging
                ? { duration: 0 }
                : { type: 'spring', stiffness: 300, damping: 30 }
            }
            onAnimationComplete={() => {
              if (!draggingRef.current) setFitViewTrigger((n) => n + 1);
            }}
            className="flex shrink-0 overflow-hidden"
          >
            <WorkflowSplitter onMouseDown={handleMouseDown} isDragging={isDragging} />

            <div className="flex-1 overflow-hidden border-l border-border/40">
              <WorkflowCanvas className="h-full rounded-none border-0" fitViewTrigger={fitViewTrigger} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Home;
