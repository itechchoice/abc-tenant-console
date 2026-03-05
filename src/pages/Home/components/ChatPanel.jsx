import {
  useState, useRef, useCallback, memo, useEffect,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUp, Square, MessageCircle, Code, FileText, Plus,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import LogoSvg from '@/assets/svg/logo.svg';
import { useChatStore } from '@/stores/chatStore';
import { useConversationDetail, chatQueryKeys } from '@/hooks/useChatHistory';
import { useAgentChat } from '@/hooks/useAgentChat';
import { ChatMain } from '@/components/Chat/ChatMain';
import ModelSelector from './ModelSelector';
import AgentSelector from './AgentSelector';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

const BUBBLE_DEFS = [
  { side: 'left', w: '62%', h: 52 },
  { side: 'right', w: '44%', h: 40 },
  { side: 'left', w: '78%', h: 68 },
  { side: 'right', w: '36%', h: 36 },
  { side: 'left', w: '54%', h: 48 },
];

function ChatSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl flex flex-col gap-5">
        {BUBBLE_DEFS.map((def) => (
          <div
            key={`${def.side}-${def.w}`}
            className={cn(
              'flex items-start gap-3',
              def.side === 'right' && 'flex-row-reverse',
            )}
          >
            <div className="h-7 w-7 shrink-0 rounded-full bg-muted/50 animate-pulse" />
            <div
              className={cn(
                'rounded-2xl animate-pulse',
                def.side === 'right'
                  ? 'rounded-tr-sm bg-primary/8'
                  : 'rounded-tl-sm bg-muted/50',
              )}
              style={{
                width: def.w,
                height: `${def.h}px`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Welcome state
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  { icon: MessageCircle, label: 'Explain a concept', prompt: 'Explain how neural networks learn from data' },
  { icon: Code, label: 'Write some code', prompt: 'Write a debounce utility function in JavaScript' },
  { icon: FileText, label: 'Summarize content', prompt: 'Help me summarize a long document' },
];

const suggestionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 24,
      delay: 0.15 + i * 0.06,
    },
  }),
};

const WelcomeState = memo(({ onSuggestion }) => (
  <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24">
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      className="flex flex-col items-center max-w-lg"
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 ring-1 ring-zinc-800">
        <img src={LogoSvg} alt="" className="h-5 w-auto" />
      </div>

      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        How can I help you today?
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-[42ch] text-center">
        Start a conversation below, or pick a suggestion to get going.
      </p>

      <div className="mt-8 grid w-full max-w-sm gap-2.5">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.label}
            custom={i}
            variants={suggestionVariants}
            initial="hidden"
            animate="visible"
            type="button"
            onClick={() => onSuggestion(s.prompt)}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-4 py-3 text-left text-[13px]',
              'border border-border/60 bg-background',
              'transition-all hover:border-border hover:shadow-sm',
              'active:scale-[0.98]',
            )}
          >
            <s.icon size={15} className="shrink-0 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
            <span className="text-foreground/80 group-hover:text-foreground transition-colors">
              {s.label}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  </div>
));
WelcomeState.displayName = 'WelcomeState';

// ---------------------------------------------------------------------------
// Mode tabs config
// ---------------------------------------------------------------------------

const CHAT_MODES = [
  { value: 'auto', label: 'Auto' },
  { value: 'agent', label: 'Agent' },
  { value: 'model', label: 'Model' },
];

const MODE_GLOW = {
  auto: 'shadow-[0_1px_8px_rgba(0,0,0,0.04)] focus-within:shadow-[0_2px_16px_rgba(0,0,0,0.06)]',
  agent: 'shadow-[0_1px_10px_rgba(217,170,75,0.08)] focus-within:shadow-[0_2px_20px_rgba(217,170,75,0.13)]',
  model: 'shadow-[0_1px_10px_rgba(56,152,236,0.08)] focus-within:shadow-[0_2px_20px_rgba(56,152,236,0.13)]',
};

const MODE_TAB_ACTIVE = {
  auto: 'bg-background text-foreground shadow-sm',
  agent: 'bg-amber-50 text-amber-700 shadow-sm dark:bg-amber-950/40 dark:text-amber-400',
  model: 'bg-sky-50 text-sky-700 shadow-sm dark:bg-sky-950/40 dark:text-sky-400',
};

/**
 * Toggle the "burst ripple" micro-interaction on mode switch.
 * `true`  → border flash + outward ripple dissolving into colored shadow.
 * `false` → plain colored-shadow crossfade only (no ripple).
 */
const ENABLE_MODE_BURST = true;

const MODE_BURST_COLOR = {
  auto: 'transparent',
  agent: 'rgba(217,170,75,0.45)',
  model: 'rgba(56,152,236,0.45)',
};

// ---------------------------------------------------------------------------
// ChatInput
// ---------------------------------------------------------------------------

const ChatInput = memo(({ onSend, isLoading, onStop }) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  const chatMode = useChatStore((s) => s.chatMode);
  const setChatMode = useChatStore((s) => s.setChatMode);

  const [burstKey, setBurstKey] = useState(0);
  const prevModeRef = useRef(chatMode);
  useEffect(() => {
    if (prevModeRef.current !== chatMode && chatMode !== 'auto') {
      setBurstKey((k) => k + 1);
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

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="mx-auto max-w-3xl">
        <div className="relative">
          {/* ── Burst ripple layer (controlled by ENABLE_MODE_BURST) ── */}
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
            )}
          >
            {/* ── Mode tabs ─────────────────────────────────────────── */}
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

            {/* ── Textarea zone ─────────────────────────────────────── */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Reply..."
              rows={1}
              disabled={isLoading}
              className={cn(
                'w-full resize-none bg-transparent px-5 pt-3 pb-1 text-sm leading-relaxed',
                'outline-none placeholder:text-muted-foreground/40',
                'disabled:opacity-60 max-h-[200px]',
              )}
            />

            {/* ── Bottom toolbar ────────────────────────────────────── */}
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
                {/* ── Dynamic selector per mode ──────────────────────── */}
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
          AI-generated content may be inaccurate. Verify important information.
        </p>
      </div>
    </div>
  );
});
ChatInput.displayName = 'ChatInput';

// ---------------------------------------------------------------------------
// ChatPanel
// ---------------------------------------------------------------------------

export default function ChatPanel() {
  const currentSessionId = useChatStore((s) => s.currentSessionId);
  const messages = useChatStore((s) => s.messages);

  const queryClient = useQueryClient();

  const handleSessionCreated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    queryClient.refetchQueries({ queryKey: chatQueryKeys.conversations });
  }, [queryClient]);

  const { sendMessage, stopStream, isLoading: isSending } = useAgentChat({
    onSessionCreated: handleSessionCreated,
  });

  const {
    data: sessionDetail,
    isLoading: isLoadingDetail,
  } = useConversationDetail(currentSessionId);

  const handleSend = useCallback((content) => {
    sendMessage(content, {
      sessionId: useChatStore.getState().currentSessionId || undefined,
    });
  }, [sendMessage]);

  const hasMessages = messages.length > 0;
  const showSkeleton = isLoadingDetail && !hasMessages;
  const showWelcome = !currentSessionId && !hasMessages && !isLoadingDetail;

  return (
    <div className="flex flex-1 flex-col min-w-0 bg-background">
      {/* ── Chat header ────────────────────────────────────────────── */}
      {(currentSessionId || hasMessages) && (
        <div className="flex h-12 shrink-0 items-center border-b border-border/40 px-6">
          <h3 className="text-[13px] font-medium text-foreground/70 truncate">
            {sessionDetail?.title || (currentSessionId ? 'Conversation' : 'New Conversation')}
          </h3>
        </div>
      )}

      {/* ── Main content area ──────────────────────────────────────── */}
      {showSkeleton ? (
        <ChatSkeleton />
      ) : showWelcome ? (
        <WelcomeState onSuggestion={handleSend} />
      ) : (
        <ChatMain className="flex-1" />
      )}

      {/* ── Input area ─────────────────────────────────────────────── */}
      <ChatInput
        onSend={handleSend}
        isLoading={isSending}
        onStop={stopStream}
      />
    </div>
  );
}
