import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Square } from 'lucide-react';
import { useWorkflowRuntimeStore } from '@/stores/workflowRuntimeStore';
import { cn } from '@/lib/utils';
import ModelSelector from '../ModelSelector';
import ToolsPicker from '../ToolsPicker';
import WorkflowPicker from '../WorkflowPicker';
import { InputTagList } from './InputTagList';
import { buildCapabilities } from './capabilityTypes';
import type { ToolSelection, SelectedWorkflow } from './capabilityTypes';

export interface ChatInputMeta {
  capabilities?: string[];
}

interface ChatInputProps {
  onSend: (content: string, meta?: ChatInputMeta) => void;
  isLoading: boolean;
  onStop: () => void;
}

export function ChatInput({ onSend, isLoading, onStop }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [selectedTools, setSelectedTools] = useState<ToolSelection[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<SelectedWorkflow | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const workflowPhase = useWorkflowRuntimeStore((s) => s.phase);
  const workflowStatus = useWorkflowRuntimeStore((s) => s.status);
  const currentStepId = useWorkflowRuntimeStore((s) => s.currentStepId);
  const steps = useWorkflowRuntimeStore((s) => s.steps);
  const currentStep = steps.find((step) => step.id === currentStepId);

  const resetHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) el.style.height = 'auto';
  }, []);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    const caps = buildCapabilities(selectedTools, selectedWorkflow);
    const meta: ChatInputMeta | undefined = caps.length > 0 ? { capabilities: caps } : undefined;
    onSend(trimmed, meta);

    setValue('');
    setSelectedTools([]);
    setSelectedWorkflow(null);
    resetHeight();
  }, [value, isLoading, onSend, selectedTools, selectedWorkflow, resetHeight]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleRemoveTool = useCallback((index: number) => {
    setSelectedTools((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleRemoveWorkflow = useCallback(() => {
    setSelectedWorkflow(null);
  }, []);

  const canSend = value.trim().length > 0 && !isLoading;
  const showCanvasHint = workflowPhase === 'live' || workflowPhase === 'review';
  const placeholder = workflowStatus === 'waiting'
    ? 'Provide the requested details to continue the workflow...'
    : workflowPhase === 'live'
      ? 'Reply while the execution is still running...'
      : 'Reply...';

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="mx-auto max-w-3xl">
        <div className="relative">
          <div
            className={cn(
              'relative flex flex-col rounded-2xl border border-border/50',
              'bg-background transition-all duration-300',
              'focus-within:border-border',
              'shadow-[0_1px_8px_rgba(0,0,0,0.04)] focus-within:shadow-[0_2px_16px_rgba(0,0,0,0.06)]',
              workflowStatus === 'waiting' && 'border-amber-200 bg-amber-50/50',
            )}
          >
            {showCanvasHint && (
              <div className="flex items-center justify-between border-b border-border/40 px-4 py-2 text-[11px]">
                <div className="flex items-center gap-2 text-muted-foreground/80">
                  <span className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    workflowStatus === 'waiting'
                      ? 'bg-amber-500'
                      : workflowPhase === 'review'
                        ? 'bg-emerald-500'
                        : 'bg-sky-500 animate-pulse',
                  )}
                  />
                  <span className="font-medium text-foreground/75">
                    {workflowStatus === 'waiting'
                      ? 'Workflow paused for your input'
                      : workflowPhase === 'review'
                        ? 'Execution summary ready in the canvas'
                        : 'Live execution is active in the canvas'}
                  </span>
                </div>

                <span className="truncate text-muted-foreground/60">
                  {currentStep?.title || 'Execution stage'}
                </span>
              </div>
            )}

            <InputTagList
              tools={selectedTools}
              workflow={selectedWorkflow}
              onRemoveTool={handleRemoveTool}
              onRemoveWorkflow={handleRemoveWorkflow}
            />

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              disabled={isLoading}
              className={cn(
                'w-full resize-none bg-transparent px-5 pt-4 pb-1 text-sm leading-relaxed',
                'outline-none placeholder:text-muted-foreground/40',
                'disabled:opacity-60 max-h-[200px]',
                (selectedTools.length > 0 || selectedWorkflow) && 'pt-2',
              )}
            />

            <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
              <div className="flex items-center gap-0.5">
                <ToolsPicker selections={selectedTools} onChange={setSelectedTools} />
                <WorkflowPicker selected={selectedWorkflow} onChange={setSelectedWorkflow} />
              </div>

              <div className="flex items-center gap-1.5">
                <ModelSelector />

                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.button
                      key="stop"
                      type="button"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.12 }}
                      onClick={onStop}
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                        'bg-destructive/10 text-destructive hover:bg-destructive/20',
                        'transition-colors active:scale-95',
                      )}
                    >
                      <Square size={13} />
                    </motion.button>
                  ) : (
                    <motion.button
                      key="send"
                      type="button"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.12 }}
                      onClick={handleSubmit}
                      disabled={!canSend}
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all',
                        canSend
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
                          : 'text-muted-foreground/30',
                      )}
                    >
                      <ArrowUp size={15} strokeWidth={2.5} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-2.5 text-center text-[10px] text-muted-foreground/30">
          {workflowStatus === 'waiting'
            ? 'The workflow is waiting for your input. Review the request before continuing.'
            : 'AI-generated content may be inaccurate. Verify important information.'}
        </p>
      </div>
    </div>
  );
}
