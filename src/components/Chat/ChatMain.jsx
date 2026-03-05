import {
  useRef, useEffect, useCallback, memo,
} from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { MarkdownMessage } from '@/components/GenerativeUI/MarkdownMessage';
import { ToolCallCard } from '@/components/GenerativeUI/ToolCallCard';
import { InteractionForm } from '@/components/GenerativeUI/InteractionForm';
import { cn } from '@/lib/utils';

/**
 * @typedef {import('@/schemas/chatSchema').Message} Message
 */

// ---------------------------------------------------------------------------
// Props typedef
// ---------------------------------------------------------------------------

/**
 * @typedef {object} ChatMainProps
 * @property {string}  [className] – Additional class names for the scroll container.
 * @property {(payload: import('@/components/GenerativeUI/InteractionForm')
 *   .InteractionSubmitPayload) => void} [onInteractionSubmit]
 *   Callback forwarded to any `InteractionForm` rendered within the list.
 */

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

const bubbleVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 280, damping: 24 },
  },
};

// ---------------------------------------------------------------------------
// TypingIndicator
// ---------------------------------------------------------------------------

const dotTransition = {
  duration: 0.4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut',
};

const TypingIndicator = memo(() => (
  <div className="flex items-start gap-3 px-4 py-2">
    <Avatar author="assistant" />
    <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
          animate={{ y: [0, -4, 0] }}
          transition={{ ...dotTransition, delay: i * 0.12 }}
        />
      ))}
    </div>
  </div>
));
TypingIndicator.displayName = 'TypingIndicator';

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

/**
 * @param {object} props
 * @param {'user' | 'assistant' | 'system' | 'tool'} props.author
 */
function Avatar({ author }) {
  const isUser = author === 'user';
  return (
    <div
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border',
        isUser
          ? 'border-primary/20 bg-primary/10 text-primary'
          : 'border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
      )}
    >
      {isUser ? <User size={14} /> : <Bot size={14} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message type resolution
// ---------------------------------------------------------------------------

/**
 * Determines the rendering strategy for a single message.
 *
 * @param {Message} msg
 * @returns {'tool_call' | 'interaction' | 'text'}
 */
function resolveMessageType(msg) {
  if (msg.metadata?.type === 'tool_call' || msg.role === 'tool') return 'tool_call';
  if (msg.metadata?.type === 'interaction') return 'interaction';
  return 'text';
}

/**
 * Maps a message-level status to the ToolCallCard status enum.
 *
 * @param {Message} msg
 * @returns {'pending' | 'success' | 'error'}
 */
function resolveToolStatus(msg) {
  const toolStatus = msg.toolCalls?.[0]?.status;
  if (toolStatus === 'completed') return 'success';
  if (toolStatus === 'error' || msg.status === 'error') return 'error';
  return 'pending';
}

// ---------------------------------------------------------------------------
// MessageRow (single message renderer)
// ---------------------------------------------------------------------------

/** @param {{ msg: Message, onInteractionSubmit?: Function }} props */
const MessageRow = memo(({ msg, onInteractionSubmit }) => {
  const msgType = resolveMessageType(msg);

  // ── Tool call card ──────────────────────────────────────────────
  if (msgType === 'tool_call') {
    const tool = msg.toolCalls?.[0];
    return (
      <div className="px-4 py-1">
        <ToolCallCard
          toolName={tool?.name || msg.metadata?.toolName || 'Unknown tool'}
          args={tool?.args}
          status={resolveToolStatus(msg)}
          result={tool?.result}
        />
      </div>
    );
  }

  // ── Interaction form ────────────────────────────────────────────
  if (msgType === 'interaction') {
    return (
      <div className="px-4 py-1">
        <InteractionForm
          widgets={msg.metadata?.widgets ?? []}
          onSubmit={onInteractionSubmit}
        />
      </div>
    );
  }

  // ── System message ──────────────────────────────────────────────
  if (msg.role === 'system') {
    return (
      <motion.div
        variants={bubbleVariants}
        initial="hidden"
        animate="visible"
        className="px-4 py-2 text-center text-xs text-muted-foreground"
      >
        {msg.content}
      </motion.div>
    );
  }

  // ── Skip empty assistant placeholders (pending with no content yet)
  if (msg.role === 'assistant' && !msg.content && msg.status !== 'streaming') {
    return null;
  }

  // ── User / Assistant text bubble ────────────────────────────────
  const isUser = msg.role === 'user';

  return (
    <motion.div
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'flex items-start gap-3 px-4 py-2',
        isUser && 'flex-row-reverse',
      )}
    >
      <Avatar author={msg.role} />

      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5',
          isUser
            ? 'rounded-tr-sm bg-primary text-primary-foreground'
            : 'rounded-tl-sm bg-muted text-foreground',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {msg.content}
          </p>
        ) : (
          <MarkdownMessage content={msg.content} />
        )}
      </div>
    </motion.div>
  );
});
MessageRow.displayName = 'MessageRow';

// ---------------------------------------------------------------------------
// ChatMain
// ---------------------------------------------------------------------------

/**
 * Primary chat viewport – renders the full message list with polymorphic
 * dispatching (text bubbles, tool call cards, interaction forms) and
 * automatic scroll-to-bottom behaviour.
 *
 * @param {ChatMainProps} props
 */
export function ChatMain({ className, onInteractionSubmit }) {
  const messages = useChatStore((s) => s.messages);
  const isTyping = useChatStore((s) => s.isTyping);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isTyping]);

  const handleInteractionSubmit = useCallback(
    (payload) => { onInteractionSubmit?.(payload); },
    [onInteractionSubmit],
  );

  return (
    <div className={cn('flex flex-1 flex-col overflow-y-auto', className)}>
      <div className="mx-auto w-full max-w-3xl py-6">
        {messages.map((msg) => (
          <MessageRow
            key={msg.id}
            msg={msg}
            onInteractionSubmit={handleInteractionSubmit}
          />
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={endRef} aria-hidden="true" />
      </div>
    </div>
  );
}
