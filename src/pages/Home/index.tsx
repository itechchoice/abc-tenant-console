import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore, selectActiveSessionId } from '@/stores/chatStore';
import type { NodeExecState } from '@/stores/chatStore';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { NodeExecutionDetailDrawer } from '@itechchoice/mcp-fe-shared/workflow-editor';
import ConversationSidebar from './components/ConversationSidebar';
import ChatPanel from './components/ChatPanel';

const SESSION_SIDEBAR_STORAGE_KEY = 'conversation-sidebar-open';

function getInitialConversationSidebarOpen(): boolean {
  try {
    const cached = localStorage.getItem(SESSION_SIDEBAR_STORAGE_KEY);
    return cached == null ? true : cached === 'true';
  } catch {
    return true;
  }
}

interface ExecutionNode {
  id: string;
  name?: string;
  status?: string;
  success?: boolean;
  error?: unknown;
  config?: Record<string, unknown>;
  durationMs?: number;
}

function toExecutionNode(nodeId: string, state: NodeExecState): ExecutionNode {
  return {
    id: nodeId,
    name: nodeId,
    status: state.status === 'completed' ? 'complete' : state.status,
    success: state.success,
    error: state.reason ?? (state.payload?.error as string | undefined),
    config: { nodeType: state.nodeType },
    durationMs:
      state.startTimestamp && state.endTimestamp
        ? new Date(state.endTimestamp).getTime() - new Date(state.startTimestamp).getTime()
        : undefined,
  };
}

function Home() {
  const [conversationSidebarOpen, setConversationSidebarOpen] = useState(getInitialConversationSidebarOpen);
  const [selectedNode, setSelectedNode] = useState<ExecutionNode | null>(null);

  const setConversationSidebarVisible = useCallback((next: boolean) => {
    setConversationSidebarOpen(next);
    try {
      localStorage.setItem(SESSION_SIDEBAR_STORAGE_KEY, String(next));
    } catch { /* noop */ }
  }, []);
  const collapseConversationSidebar = useCallback(() => {
    setConversationSidebarVisible(false);
  }, [setConversationSidebarVisible]);
  const expandConversationSidebar = useCallback(() => {
    setConversationSidebarVisible(true);
  }, [setConversationSidebarVisible]);

  const handleNodeClick = useCallback((nodeId: string) => {
    const store = useChatStore.getState();
    const sessionId = selectActiveSessionId(store);
    const session = store.sessions.get(sessionId);
    if (!session) return;

    for (const exec of session.workflowExecutions.values()) {
      const nodeState = exec.nodeStates[nodeId];
      if (nodeState) {
        setSelectedNode(toExecutionNode(nodeId, nodeState));
        return;
      }
    }

    setSelectedNode({ id: nodeId, name: nodeId, status: 'pending' });
  }, []);

  const closeDrawer = useCallback(() => setSelectedNode(null), []);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <AnimatePresence initial={false}>
        {conversationSidebarOpen && (
          <motion.div
            key="conversation-sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="shrink-0 overflow-hidden"
          >
            <ConversationSidebar onCollapse={collapseConversationSidebar} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex flex-1 flex-col min-w-0 min-h-0 bg-background">
        <ChatPanel onNodeClick={handleNodeClick} />

        {!conversationSidebarOpen && (
          <button
            type="button"
            onClick={expandConversationSidebar}
            aria-label="Show conversations"
            className={cn(
              'absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-lg',
              'bg-background/80 backdrop-blur-sm border border-border/60 shadow-sm',
              'text-muted-foreground hover:text-foreground hover:border-border',
              'transition-all active:scale-95',
            )}
          >
            <PanelLeft size={14} strokeWidth={1.8} />
          </button>
        )}
      </div>

      <Sheet open={!!selectedNode} onOpenChange={(open) => { if (!open) closeDrawer(); }}>
        <SheetContent side="right" showCloseButton={false} className="w-[380px] sm:max-w-[380px] p-0 gap-0">
          <NodeExecutionDetailDrawer node={selectedNode} onClose={closeDrawer} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default Home;
