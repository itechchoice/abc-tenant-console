import { useCallback, useEffect, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Square, Loader2, CheckCircle2, XCircle, RotateCcw,
  AlertTriangle, ShieldCheck, ShieldAlert, FlaskConical,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkflowEditorLocalStore } from '@/stores/workflowEditorStore';
import { useNodeRuntimeStore } from '@itechchoice/mcp-fe-shared/workflow-editor';
import type { CanvasAreaHandle } from '@itechchoice/mcp-fe-shared/workflow-editor';
import { useTestRunWorkflow } from '../../hooks/useWorkflowRuns';
import { useWorkflowDependencies } from '../../hooks/useWorkflowDependencies';
import { useAuthStore } from '@/stores/authStore';
import type { DependencyItem } from '@/schemas/workflowEditorSchema';

interface RunDrawerProps {
  workflowId?: string;
  canvasRef?: React.RefObject<CanvasAreaHandle | null>;
}

interface RunMessage {
  id: string;
  type: 'system' | 'node' | 'user' | 'result';
  content: string;
  nodeId?: string;
  status?: string;
}

type RunState = 'idle' | 'running' | 'completed' | 'error';

export default function RunDrawer({ workflowId, canvasRef }: RunDrawerProps) {
  const { runDrawerOpen, closeRunDrawer } = useWorkflowEditorLocalStore();
  const { setNodeState, clearAllNodeStates } = useNodeRuntimeStore();
  const testRunMutation = useTestRunWorkflow();

  const [runState, setRunState] = useState<RunState>('idle');
  const [messages, setMessages] = useState<RunMessage[]>([]);
  const [testMessage, setTestMessage] = useState('');
  const [activeTab, setActiveTab] = useState<string>('run');
  const eventSourceRef = useRef<EventSource | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dependencies
  const [depsChecked, setDepsChecked] = useState(false);
  const { data: dependencies, isLoading: depsLoading, refetch: recheckDeps } =
    useWorkflowDependencies(workflowId, depsChecked);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!runDrawerOpen) {
      eventSourceRef.current?.close();
    }
  }, [runDrawerOpen]);

  const focusNode = useCallback((nodeId: string) => {
    if (!canvasRef?.current) return;
    canvasRef.current.fitView?.({
      nodes: [{ id: nodeId }],
      padding: 0.6,
      duration: 400,
      maxZoom: 1.2,
    });
  }, [canvasRef]);

  const subscribeSSE = useCallback((taskId: string, sessionId: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `task-${taskId}`, type: 'system', content: `Task ${taskId} (session ${sessionId}) created` },
    ]);

    const token = useAuthStore.getState().token;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/tenant-console-api';
    const url = `${baseUrl}/tasks/${taskId}/events${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        const nodeId = data.nodeId as string | undefined;
        const status = data.status as string | undefined;
        const content = data.message || data.content || JSON.stringify(data);

        if (nodeId && status) {
          setNodeState(nodeId, { status, triggerType: 'execution' });
          focusNode(nodeId);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `sse-${Date.now()}-${Math.random()}`,
            type: nodeId ? 'node' : 'system',
            content: String(content),
            nodeId,
            status,
          },
        ]);
      } catch { /* skip unparseable frames */ }
    };

    es.addEventListener('TASK_COMPLETED', () => {
      setMessages((prev) => [
        ...prev,
        { id: 'done', type: 'result', content: 'Workflow execution finished.' },
      ]);
      setRunState('completed');
      es.close();
    });

    es.addEventListener('TASK_FAILED', (e) => {
      const errMsg = (e as MessageEvent)?.data || 'Execution failed';
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, type: 'system', content: `Error: ${errMsg}` },
      ]);
      setRunState('error');
      es.close();
    });

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) return;
      setRunState('error');
      es.close();
    };
  }, [setNodeState, focusNode]);

  const startRun = useCallback(async () => {
    if (!workflowId) return;

    setDepsChecked(true);
    clearAllNodeStates();
    setRunState('running');
    setMessages([{ id: 'start', type: 'system', content: 'Test run starting...' }]);

    try {
      const result = await testRunMutation.mutateAsync({
        workflowId,
        message: testMessage.trim() || undefined,
      });
      subscribeSSE(result.taskId, result.sessionId);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: 'fail', type: 'system', content: `Failed to start: ${err instanceof Error ? err.message : String(err)}` },
      ]);
      setRunState('error');
    }
  }, [workflowId, testMessage, testRunMutation, clearAllNodeStates, subscribeSSE]);

  const handleStop = useCallback(() => {
    eventSourceRef.current?.close();
    setRunState('idle');
    setMessages((prev) => [...prev, { id: 'abort', type: 'system', content: 'Execution stopped.' }]);
  }, []);

  const handleReset = useCallback(() => {
    clearAllNodeStates();
    setMessages([]);
    setRunState('idle');
    setTestMessage('');
  }, [clearAllNodeStates]);

  const handleClose = useCallback(() => {
    eventSourceRef.current?.close();
    clearAllNodeStates();
    closeRunDrawer();
    setMessages([]);
    setRunState('idle');
    setDepsChecked(false);
    setTestMessage('');
  }, [clearAllNodeStates, closeRunDrawer]);

  return (
    <Sheet open={runDrawerOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <SheetContent className="w-[480px] sm:max-w-[480px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            Test Run Workflow
            {runState === 'running' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            {runState === 'completed' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            {runState === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 mt-3 w-fit">
            <TabsTrigger value="run">
              <FlaskConical className="h-3.5 w-3.5 mr-1" />Test
            </TabsTrigger>
            <TabsTrigger value="deps">
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />Dependencies
            </TabsTrigger>
          </TabsList>

          {/* ─── Run Tab ─── */}
          <TabsContent value="run" className="flex-1 flex flex-col min-h-0 mt-0">
            <div className="flex-1 overflow-auto p-4 space-y-2 min-h-0">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Run the current workflow definition for testing and debugging.
                </p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    msg.type === 'user'
                      ? 'bg-primary text-primary-foreground ml-8'
                      : msg.type === 'system'
                      ? 'bg-muted text-muted-foreground text-xs'
                      : msg.type === 'result'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : msg.status === 'error' || msg.status === 'failed'
                      ? 'bg-destructive/10 text-destructive'
                      : msg.status === 'complete' || msg.status === 'completed'
                      ? 'bg-secondary'
                      : msg.status === 'skipped'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-secondary/50 text-muted-foreground'
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4 space-y-3 shrink-0">
              {runState === 'idle' && (
                <Input
                  placeholder="Test message (optional)..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') startRun(); }}
                />
              )}
              <div className="flex items-center gap-2">
                {runState === 'idle' && (
                  <Button className="flex-1" onClick={startRun} disabled={testRunMutation.isPending}>
                    <FlaskConical className="h-4 w-4 mr-1" />
                    Test Run
                  </Button>
                )}
                {runState === 'running' && (
                  <Button variant="destructive" className="flex-1" onClick={handleStop}>
                    <Square className="h-4 w-4 mr-1" />
                    Stop
                  </Button>
                )}
                {(runState === 'completed' || runState === 'error') && (
                  <>
                    <Button variant="outline" className="flex-1" onClick={handleReset}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                    <Button className="flex-1" onClick={startRun} disabled={testRunMutation.isPending}>
                      <FlaskConical className="h-4 w-4 mr-1" />
                      Re-run
                    </Button>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ─── Dependencies Tab ─── */}
          <TabsContent value="deps" className="flex-1 overflow-auto p-4 mt-0">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">MCP Server Dependencies</h4>
              <Button variant="outline" size="sm" onClick={() => { setDepsChecked(true); recheckDeps(); }} disabled={depsLoading}>
                {depsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Check
              </Button>
            </div>
            {!depsChecked ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Click "Check" to verify MCP server authorization status.
              </p>
            ) : depsLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
            ) : !dependencies?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">No MCP dependencies found.</p>
            ) : (
              <div className="space-y-2">
                {dependencies.map((dep: DependencyItem) => (
                  <div key={dep.serverCode} className="flex items-center justify-between border rounded-lg px-3 py-2">
                    <span className="text-sm font-mono">{dep.serverCode}</span>
                    {dep.authorized ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                        <ShieldCheck className="h-3 w-3 mr-1" />Authorized
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        <ShieldAlert className="h-3 w-3 mr-1" />Unauthorized
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
