import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wrench, GitBranch, Sparkles } from 'lucide-react';
import { useWorkflowRuntimeStore } from '@/stores/workflowRuntimeStore';
import { InteractionForm } from '@/components/GenerativeUI/InteractionForm';
import { MarkdownMessage } from '@/components/GenerativeUI/MarkdownMessage';
import { ToolCallCard } from '@/components/GenerativeUI/ToolCallCard';
import { cn } from '@/lib/utils';
import type { Message } from '@/schemas/chatSchema';
import { ChatAvatar } from './ChatAvatar';
import { resolveMessageType, resolveToolStatus } from './messageResolvers';

interface MessageRowProps {
  msg: Message;
  onInteractionSubmit: (payload: { actionId: string; formData: Record<string, string> }) => void;
}

// ---------------------------------------------------------------------------
// Capability tags shown beneath user message content
// ---------------------------------------------------------------------------

function parseCapLabel(cap: string): { icon: 'all' | 'tool' | 'workflow'; label: string } {
  if (cap === '*') return { icon: 'all', label: 'All Tools' };
  if (cap.startsWith('workflow:')) return { icon: 'workflow', label: cap.slice('workflow:'.length) };
  return { icon: 'tool', label: cap };
}

function CapabilityTags({ capabilities }: { capabilities: string[] }) {
  const tags = useMemo(() => capabilities.map(parseCapLabel), [capabilities]);
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {tags.map((tag) => (
        <span
          key={tag.label}
          className="inline-flex items-center gap-1 rounded-md bg-primary-foreground/15 px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground/80"
        >
          {tag.icon === 'all' && <Sparkles size={9} />}
          {tag.icon === 'tool' && <Wrench size={9} />}
          {tag.icon === 'workflow' && <GitBranch size={9} />}
          <span className="max-w-[100px] truncate">{tag.label}</span>
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

const bubbleVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 280, damping: 24 },
  },
};

export const MessageRow = memo(({ msg, onInteractionSubmit }: MessageRowProps) => {
  const msgType = resolveMessageType(msg);
  const selectStepByMessageId = useWorkflowRuntimeStore((s) => s.selectStepByMessageId);
  const selectedMessageId = useWorkflowRuntimeStore((s) => s.selectedMessageId);
  const workflowPhase = useWorkflowRuntimeStore((s) => s.phase);
  const workflowStatus = useWorkflowRuntimeStore((s) => s.status);

  if (msgType === 'tool_call') {
    const tool = msg.toolCalls?.[0];
    return (
      <div id={`message-${msg.id}`} className="px-4 py-1">
        <ToolCallCard
          toolName={tool?.name || msg.metadata?.toolName || 'Unknown tool'}
          args={tool?.args}
          status={resolveToolStatus(msg)}
          result={tool?.result}
          onInspect={() => selectStepByMessageId(msg.id)}
          isActive={selectedMessageId === msg.id}
        />
      </div>
    );
  }

  if (msgType === 'interaction') {
    return (
      <div id={`message-${msg.id}`} className="px-4 py-1">
        <InteractionForm
          widgets={msg.metadata?.widgets ?? []}
          onSubmit={onInteractionSubmit}
        />
      </div>
    );
  }

  if (msg.role === 'system') {
    return (
      <div id={`message-${msg.id}`}>
        <motion.div
          variants={bubbleVariants}
          initial="hidden"
          animate="visible"
          className="px-4 py-2 text-center text-xs text-muted-foreground"
        >
          {msg.content}
        </motion.div>
      </div>
    );
  }

  if (msg.role === 'assistant' && !msg.content) {
    return null;
  }

  const isUser = msg.role === 'user';

  return (
    <div id={`message-${msg.id}`}>
      <motion.div
        variants={bubbleVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          'flex items-start gap-3 px-4 py-2',
          isUser && 'flex-row-reverse',
        )}
      >
        <ChatAvatar author={msg.role} />

        <div
          className={cn(
            'max-w-[75%] rounded-2xl px-4 py-2.5',
            isUser
              ? 'rounded-tr-sm bg-primary text-primary-foreground'
              : 'rounded-tl-sm bg-muted text-foreground',
          )}
        >
          {!isUser && msg.status === 'streaming' && workflowPhase === 'live' && (
            <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-background/70 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {workflowStatus === 'waiting' ? 'Waiting in canvas' : 'Live in canvas'}
            </div>
          )}

          {isUser ? (
            <>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {msg.content}
              </p>
              {Array.isArray(msg.metadata?.capabilities) && msg.metadata.capabilities.length > 0 && (
                <CapabilityTags capabilities={msg.metadata.capabilities as string[]} />
              )}
            </>
          ) : (
            <MarkdownMessage content={msg.content} />
          )}
        </div>
      </motion.div>
    </div>
  );
});

MessageRow.displayName = 'MessageRow';
