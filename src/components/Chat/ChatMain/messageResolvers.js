export function resolveMessageType(msg) {
  if (msg.metadata?.type === 'tool_call' || msg.role === 'tool') return 'tool_call';
  if (msg.metadata?.type === 'interaction') return 'interaction';
  return 'text';
}

export function resolveToolStatus(msg) {
  const toolStatus = msg.toolCalls?.[0]?.status;
  if (toolStatus === 'completed') return 'success';
  if (toolStatus === 'error' || msg.status === 'error') return 'error';
  return 'pending';
}
