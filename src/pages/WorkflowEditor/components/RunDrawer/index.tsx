import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchEventSource, EventStreamContentType } from '@microsoft/fetch-event-source';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Square, Loader2, CheckCircle2, XCircle, RotateCcw,
  AlertTriangle, FlaskConical,
} from 'lucide-react';
import { useWorkflowEditorLocalStore } from '@/stores/workflowEditorStore';
import { useNodeRuntimeStore } from '@itechchoice/mcp-fe-shared/workflow-editor';
import type { CanvasAreaHandle } from '@itechchoice/mcp-fe-shared/workflow-editor';
import { useTestRunWorkflow } from '../../hooks/useWorkflowRuns';
import { useChatModels } from '@/hooks/useModels';
import { useAuthStore } from '@/stores/authStore';
import { engineApiBaseUrl } from '@/http/client';
import DependenciesTab from './DependenciesTab';
import ExecutionTimeline from './ExecutionTimeline';
import type { ExecutionEvent } from './ExecutionTimeline';

interface RunDrawerProps {
  workflowId?: string;
  canvasRef?: React.RefObject<CanvasAreaHandle | null>;
}

type RunState = 'idle' | 'running' | 'completed' | 'error';

const SSE_TO_CANVAS_STATUS: Record<string, string> = {
  STEP_START: 'running',
  completed: 'complete',
  skipped: 'skipped',
  failed: 'error',
};

function parsePayload(raw: unknown): Record<string, unknown> {
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  return {};
}

export default function RunDrawer({ workflowId, canvasRef }: RunDrawerProps) {
  const { runDrawerOpen, closeRunDrawer } = useWorkflowEditorLocalStore();
  const { setNodeState, clearAllNodeStates } = useNodeRuntimeStore();
  const testRunMutation = useTestRunWorkflow();

  const [runState, setRunState] = useState<RunState>('idle');
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  const [testMessage, setTestMessage] = useState('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('run');
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: models = [], isLoading: modelsLoading } = useChatModels();
  const [depsChecked, setDepsChecked] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  useEffect(() => {
    if (!runDrawerOpen) {
      abortRef.current?.abort();
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

  const subscribeSSE = useCallback((taskId: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const { token, userInfo } = useAuthStore.getState();
    const url = `${engineApiBaseUrl}/tasks/${taskId}/events`;

    fetchEventSource(url, {
      signal: ctrl.signal,
      openWhenHidden: true,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(userInfo?.tenantId ? { 'X-Tenant-Id': userInfo.tenantId } : {}),
      },
      async onopen(response) {
        if (response.ok && response.headers.get('content-type')?.includes(EventStreamContentType)) {
          return;
        }
        throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
      },
      onmessage(evt) {
        const eventType = evt.event;
        try {
          const data = JSON.parse(evt.data);
          const payload = parsePayload(data.payload);
          const eventId = (data.eventId as string) || `sse-${Date.now()}`;
          const timestamp = (data.timestamp as string) || new Date().toISOString();

          const nodeId = (payload.nodeId as string) || undefined;
          const nodeType = (payload.nodeType as string) || undefined;

          const newEvent: ExecutionEvent = {
            id: eventId,
            eventType,
            timestamp,
            nodeId,
            nodeType,
            payload,
          };

          if (eventType === 'STEP_START' && nodeId) {
            setNodeState(nodeId, { status: 'running', triggerType: 'execution' });
            focusNode(nodeId);
          }

          if (eventType === 'STEP_DONE') {
            const stepStatus = (payload.status as string) || 'completed';
            const canvasStatus = SSE_TO_CANVAS_STATUS[stepStatus] || 'complete';
            newEvent.status = stepStatus;
            newEvent.error = (payload.error as string) || undefined;
            newEvent.reason = (payload.reason as string) || undefined;

            if (nodeId) {
              setNodeState(nodeId, { status: canvasStatus, triggerType: 'execution' });
              focusNode(nodeId);
            }
          }

          if (eventType === 'TASK_COMPLETED' || eventType === 'TASK_COMPLETE') {
            setEvents((prev) => [...prev, newEvent]);
            setRunState('completed');
            ctrl.abort();
            return;
          }

          if (eventType === 'TASK_FAILED') {
            newEvent.error = (payload.error as string) || (data.message as string) || 'Execution failed';
            setEvents((prev) => [...prev, newEvent]);
            setRunState('error');
            ctrl.abort();
            return;
          }

          setEvents((prev) => [...prev, newEvent]);
        } catch { /* skip unparseable frames */ }
      },
      onclose() {
        throw new Error('Stream ended');
      },
      onerror(err) {
        if (ctrl.signal.aborted) return;
        setEvents((prev) => [...prev, {
          id: `err-${Date.now()}`,
          eventType: 'ERROR',
          timestamp: new Date().toISOString(),
          payload: {},
          error: err instanceof Error ? err.message : 'Connection lost',
        }]);
        setRunState('error');
        ctrl.abort();
        throw err;
      },
    });
  }, [setNodeState, focusNode]);

  const startRun = useCallback(async () => {
    if (!workflowId) return;

    setDepsChecked(true);
    clearAllNodeStates();
    setRunState('running');
    setEvents([]);

    try {
      const result = await testRunMutation.mutateAsync({
        workflowId,
        message: testMessage.trim() || undefined,
        modelId: selectedModelId || undefined,
      });
      subscribeSSE(result.taskId);
    } catch (err) {
      setEvents([{
        id: `err-${Date.now()}`,
        eventType: 'ERROR',
        timestamp: new Date().toISOString(),
        payload: {},
        error: `Failed to start: ${err instanceof Error ? err.message : String(err)}`,
      }]);
      setRunState('error');
    }
  }, [workflowId, testMessage, selectedModelId, testRunMutation, clearAllNodeStates, subscribeSSE]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setRunState('idle');
  }, []);

  const handleReset = useCallback(() => {
    clearAllNodeStates();
    setEvents([]);
    setRunState('idle');
    setTestMessage('');
    setSelectedModelId('');
  }, [clearAllNodeStates]);

  const handleClose = useCallback(() => {
    abortRef.current?.abort();
    clearAllNodeStates();
    closeRunDrawer();
    setEvents([]);
    setRunState('idle');
    setDepsChecked(false);
    setTestMessage('');
    setSelectedModelId('');
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
            <div className="flex-1 overflow-auto p-4 min-h-0">
              <ExecutionTimeline events={events} onNodeClick={focusNode} />
              <div ref={scrollRef} />
            </div>

            <div className="border-t p-4 space-y-3 shrink-0">
              {runState === 'idle' && (
                <div className="space-y-2">
                  <Select value={selectedModelId || '__auto__'} onValueChange={(v) => setSelectedModelId(v === '__auto__' ? '' : v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder={modelsLoading ? 'Loading models...' : 'Auto'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__auto__" className="text-xs">
                        Auto (server decides)
                      </SelectItem>
                      {models.map((m) => (
                        <SelectItem key={m.id} value={m.modelId} className="text-xs">
                          {m.displayName || m.modelId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Test message (optional)..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') startRun(); }}
                  />
                </div>
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
          <TabsContent value="deps" className="flex-1 overflow-auto mt-0">
            <DependenciesTab
              workflowId={workflowId}
              depsChecked={depsChecked}
              onCheckTriggered={() => setDepsChecked(true)}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
