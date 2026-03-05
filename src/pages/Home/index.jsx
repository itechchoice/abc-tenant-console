import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelRightClose, PanelRight } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { WorkflowCanvas } from '@/components/Workflow/WorkflowCanvas';
import { cn } from '@/lib/utils';
import ConversationSidebar from './components/ConversationSidebar';
import ChatPanel from './components/ChatPanel';

/**
 * Home — AI Console main workspace.
 *
 * Three-column split-screen layout:
 *   1. Left   – ConversationSidebar  (w-64, fixed session history)
 *   2. Center – ChatPanel            (flex-1, streaming chat interface)
 *   3. Right  – WorkflowCanvas       (w-[45%], collapsible agent execution graph)
 *
 * The right panel auto-expands when the backend emits a `workflow_pending`
 * event (via `currentWorkflowId` in the store), and can be manually toggled
 * by the user at any time.
 */
function Home() {
  const currentWorkflowId = useChatStore((s) => s.currentWorkflowId);
  const [canvasVisible, setCanvasVisible] = useState(true);

  const toggleCanvas = useCallback(() => setCanvasVisible((v) => !v), []);

  const showCanvas = canvasVisible || !!currentWorkflowId;

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      {/* ── Left: Session sidebar ──────────────────────────────────── */}
      <ConversationSidebar />

      {/* ── Center: Chat panel ─────────────────────────────────────── */}
      <div className="relative flex flex-1 flex-col min-w-0 bg-background">
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

      {/* ── Right: Workflow canvas ─────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {showCanvas && (
          <motion.aside
            key="workflow-canvas"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '45%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="shrink-0 overflow-hidden border-l border-border/40"
          >
            <WorkflowCanvas className="h-full rounded-none border-0" />
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Home;
