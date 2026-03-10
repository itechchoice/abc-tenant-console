import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUp,
  Plus,
  Square,
} from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useWorkflowRuntimeStore } from '@/stores/workflowRuntimeStore';
import { cn } from '@/lib/utils';
import AgentSelector from '../AgentSelector';
import ModelSelector from '../ModelSelector';
import {
  CHAT_MODES,
  ENABLE_MODE_BURST,
  MODE_BURST_COLOR,
  MODE_GLOW,
  MODE_TAB_ACTIVE,
} from './chatInputConfig';

interface ChatInputProps {
  onSend: (content: string) => void;
  isLoading: boolean;
  onStop: () => void;
}

export function ChatInput({ onSend, isLoading, onStop }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [burstKey, setBurstKey] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevModeRef = useRef<string | null>(null);

  const chatMode = useChatStore((s) => s.chatMode);
  const setChatMode = useChatStore((s) => s.setChatMode);
  const workflowPhase = useWorkflowRuntimeStore((s) => s.phase);
  const workflowStatus = useWorkflowRuntimeStore((s) => s.status);
  const currentStepId = useWorkflowRuntimeStore((s) => s.currentStepId);
  const steps = useWorkflowRuntimeStore((s) => s.steps);
  const currentStep = steps.find((step) => step.id === currentStepId);

  useEffect(() => {
    if (prevModeRef.current !== chatMode && chatMode !== 'auto') {
      setBurstKey((key) => key + 1);
    }
    prevModeRef.current = chatMode;
  }, [chatMode]);

  const resetHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
    }
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
    onSend(trimmed);
    setValue('');
    resetHeight();
  }, [value, isLoading, onSend, resetHeight]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

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
          <AnimatePresence>
            {ENABLE_MODE_BURST && chatMode !== 'auto' && burstKey > 0 && (
              <motion.div
                key={`burst-${burstKey}`}
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 1.03 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="pointer-events-none absolute inset-0 z-10 rounded-2xl"
                style={{ boxShadow: `0 0 0 2px ${MODE_BURST_COLOR[chatMode]}` }}
              />
            )}
          </AnimatePresence>

          <div
            className={cn(
              'relative flex flex-col rounded-2xl border border-border/50',
              'bg-background transition-all duration-300',
              'focus-within:border-border',
              MODE_GLOW[chatMode],
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

            <div className="px-4 pt-3 pb-0.5">
              <div className="inline-flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5">
                {CHAT_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setChatMode(mode.value)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-[11px] font-medium transition-all',
                      chatMode === mode.value
                        ? MODE_TAB_ACTIVE[mode.value]
                        : 'text-muted-foreground/50 hover:text-muted-foreground',
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              disabled={isLoading}
              className={cn(
                'w-full resize-none bg-transparent px-5 pt-3 pb-1 text-sm leading-relaxed',
                'outline-none placeholder:text-muted-foreground/40',
                'disabled:opacity-60 max-h-[200px]',
              )}
            />

            <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
              <button
                type="button"
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg',
                  'text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent/60',
                  'transition-colors active:scale-95',
                )}
              >
                <Plus size={16} strokeWidth={1.8} />
              </button>

              <div className="flex items-center gap-1.5">
                {chatMode === 'model' && <ModelSelector />}
                {chatMode === 'agent' && <AgentSelector />}

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
