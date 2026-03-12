import { useCallback, useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { Node } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, Send, Sparkles, Eye, Loader2, Tag } from 'lucide-react';
import { useAiViewStore } from '@/stores/aiViewStore';
import { useChatStore } from '@/stores/chatStore';
import ModelSelector from '@/components/ModelSelector';
import { generateWorkflowStream } from '../mock/aiWorkflowMock';
import StepsCard from './StepsCard';
import type { CanvasAreaHandle } from '@itechchoice/mcp-fe-shared/workflow-editor';
import { convertToReactFlow } from '@itechchoice/mcp-fe-shared/workflow-editor';

interface NodeTag {
  id: string;
  label: string;
}

interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  workflow?: Record<string, unknown>;
  applied?: boolean;
  nodeTags?: NodeTag[];
}

export interface AiChatSidebarRef {
  regenerate: () => void;
}

interface AiChatSidebarProps {
  canvasRef: React.RefObject<CanvasAreaHandle | null>;
  onDirty: () => void;
  onClose: () => void;
  selectedNodes?: Node[];
  onRemoveSelectedNode?: (nodeId: string) => void;
}

const AiChatSidebar = forwardRef<AiChatSidebarRef, AiChatSidebarProps>(
  function AiChatSidebar({ canvasRef, onDirty, onClose, selectedNodes = [], onRemoveSelectedNode }, ref) {
    const [messages, setMessages] = useState<AiMessage[]>([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
      generating, generationSteps,
      startGeneration, setSteps, updateStep,
      finishGeneration, failGeneration,
      setCurrentSnapshot, setActiveView,
    } = useAiViewStore();

    const selectedModel = useChatStore((s) => s.selectedModel);
    const setSelectedModel = useChatStore((s) => s.setSelectedModel);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, generationSteps]);

    const saveCurrentSnapshot = useCallback(() => {
      const data = canvasRef.current?.getWorkflowData();
      if (data) {
        setCurrentSnapshot(data as Record<string, unknown>);
      }
    }, [canvasRef, setCurrentSnapshot]);

    const sendMessage = useCallback(async (prompt: string, nodesSnapshot?: Node[]) => {
      if (!prompt.trim()) return;

      saveCurrentSnapshot();

      const tags: NodeTag[] = (nodesSnapshot || []).map((n) => ({
        id: n.id,
        label: (n.data as { name?: string })?.name || n.id,
      }));

      const userMsg: AiMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: prompt,
        nodeTags: tags.length > 0 ? tags : undefined,
      };
      setMessages((prev) => [...prev, userMsg]);

      const controller = startGeneration(prompt);
      let chunks = '';

      const assistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: 'Generating workflow...',
      }]);

      await generateWorkflowStream(
        prompt,
        {
          onSteps: (steps) => setSteps(steps),
          onStepUpdate: (stepId, status) => updateStep(stepId, status),
          onChunk: (content) => {
            chunks += content;
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, content: chunks } : m),
            );
          },
          onResult: (workflow) => {
            finishGeneration(workflow);

            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: chunks || 'Workflow generated successfully!', workflow }
                  : m,
              ),
            );
          },
          onError: (error) => {
            failGeneration(error);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: `Error: ${error}` }
                  : m,
              ),
            );
          },
          onComplete: () => {},
        },
        controller.signal,
      );
    }, [canvasRef, saveCurrentSnapshot, startGeneration, setSteps, updateStep, finishGeneration, failGeneration]);

    const handleSend = useCallback(() => {
      if (!input.trim() || generating) return;
      const prompt = input;
      setInput('');
      sendMessage(prompt, selectedNodes);
    }, [input, generating, sendMessage, selectedNodes]);

    const regenerate = useCallback(() => {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      if (lastUserMsg) {
        const snapshot = useAiViewStore.getState().currentSnapshot;
        if (snapshot && canvasRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          canvasRef.current.loadWorkflow(snapshot as any);
        }
        sendMessage(lastUserMsg.content);
      }
    }, [messages, canvasRef, sendMessage]);

    useImperativeHandle(ref, () => ({ regenerate }), [regenerate]);

    const handleViewWorkflow = useCallback((_workflow: Record<string, unknown>) => {
      setActiveView('ai');
    }, [setActiveView]);

    const handleApplyInline = useCallback((msgId: string, workflow: Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const flowData = convertToReactFlow(workflow as any);
      canvasRef.current?.loadWorkflow(flowData);
      onDirty();
      setMessages((prev) =>
        prev.map((m) => m.id === msgId ? { ...m, applied: true } : m),
      );
    }, [canvasRef, onDirty]);

    return (
      <div className="flex flex-col w-[380px] shrink-0 border-r bg-card">
        {/* Header */}
        <div className="flex items-center justify-between h-12 px-4 border-b shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-medium">AI Workflow</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-3 space-y-3 min-h-0">
          {messages.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <Sparkles className="h-8 w-8 text-violet-400 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Describe the workflow you want to create
              </p>
              <div className="space-y-1.5">
                {['Create a data processing pipeline', 'Build a content moderation flow', 'Design an email notification system'].map((hint) => (
                  <button
                    key={hint}
                    onClick={() => setInput(hint)}
                    className="block w-full text-left px-3 py-1.5 text-xs text-muted-foreground rounded-md border hover:bg-accent hover:text-foreground transition-colors"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id}>
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-4'
                    : 'bg-secondary mr-4'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && msg.nodeTags && msg.nodeTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 ml-4">
                  {msg.nodeTags.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="gap-1 text-[10px] px-1.5 py-0">
                      <Tag className="h-2.5 w-2.5" />
                      <span>{tag.label}</span>
                    </Badge>
                  ))}
                </div>
              )}
              {msg.role === 'assistant' && msg.workflow && !msg.applied && (
                <div className="flex items-center gap-1.5 mt-1.5 ml-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleViewWorkflow(msg.workflow!)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleApplyInline(msg.id, msg.workflow!)}
                  >
                    Apply
                  </Button>
                </div>
              )}
              {msg.applied && (
                <span className="text-[10px] text-emerald-500 ml-1">Applied</span>
              )}
            </div>
          ))}

          {generating && generationSteps.length > 0 && (
            <StepsCard steps={generationSteps} />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-3 shrink-0">
          {selectedNodes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {selectedNodes.map((node) => (
                <Badge key={node.id} variant="secondary" className="gap-1 text-xs pl-1.5 pr-1">
                  <Tag className="h-3 w-3" />
                  <span>{(node.data as { name?: string })?.name || node.id}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveSelectedNode?.(node.id)}
                    className="ml-0.5 hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Describe your workflow..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={generating}
              className="text-sm"
            />
            <Button
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleSend}
              disabled={!input.trim() || generating}
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <div className="mt-2">
            <ModelSelector value={selectedModel} onChange={setSelectedModel} />
          </div>
        </div>
      </div>
    );
  },
);

export default AiChatSidebar;
