import type { Message } from '@/schemas/chatSchema';

type ResolvedMessageType = 'tool_call' | 'interaction' | 'text';
type ResolvedToolStatus = 'success' | 'error' | 'pending';

export function resolveMessageType(msg: Message): ResolvedMessageType {
  if (msg.metadata?.type === 'tool_call' || msg.role === 'tool') return 'tool_call';
  if (msg.metadata?.type === 'interaction') return 'interaction';
  return 'text';
}

export function resolveToolStatus(msg: Message): ResolvedToolStatus {
  const toolStatus = msg.toolCalls?.[0]?.status;
  if (toolStatus === 'completed') return 'success';
  if (toolStatus === 'error' || msg.status === 'error') return 'error';
  return 'pending';
}
