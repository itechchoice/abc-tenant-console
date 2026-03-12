import type { ParsedTaskEvent } from '@/schemas/taskEventSchema';
import type { Message } from '@/schemas/chatSchema';

type ChatMode = 'auto' | 'agent' | 'model';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface StreamContext {
  taskId: string;
  sessionId: string;
  assistantMessageId: string;
  chatMode: ChatMode;

  /** Mutable — handlers append token text directly. */
  streamedContent: string;
  /** Set `true` when token content changed; TaskStreamManager checks this for rAF flush. */
  needsFlush: boolean;

  addMessage: (sessionId: string, msg: Message) => void;
  updateMessage: (sessionId: string, msgId: string, patch: Partial<Message>) => void;
  getMessage: (sessionId: string, msgId: string) => Message | undefined;
  setTyping: (sessionId: string, typing: boolean) => void;

  runtime: {
    startExecution: (...args: any[]) => void;
    recordStep: (...args: any[]) => string | null;
    recordToolCall: (...args: any[]) => string | null;
    finishExecution: (status: 'completed' | 'failed') => void;
    syncExecutionContext: (...args: any[]) => void;
    markAwaitingInteraction: (...args: any[]) => string | null;
    taskId: string | null;
    currentNodeKey: string | null;
    phase: string;
    steps: Array<{ id: string; nodeKey: string; status: string }>;
    currentStepId: string | null;
  };

  startWorkflowExecution: (sessionId: string, workflowId: string) => void;
  updateNodeState: (...args: any[]) => void;
  finishWorkflowExecution: (sessionId: string, workflowId: string, status: 'completed' | 'failed') => void;
  appendStepEvent: (...args: any[]) => void;

  /** Tracks the workflowId discovered during this stream for lifecycle handlers. */
  activeWorkflowId: string | null;

  onSessionCreated?: (sessionId: string) => void;
  onStreamComplete: () => void;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export type EventHandler = (event: ParsedTaskEvent, ctx: StreamContext) => void;
