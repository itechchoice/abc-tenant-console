import type { ParsedTaskEvent } from '@/schemas/taskEventSchema';
import type { EventHandler, StreamContext } from './types';

const handlers = new Map<string, EventHandler>();

export function registerHandler(eventType: string, handler: EventHandler): void {
  handlers.set(eventType, handler);
}

export function registerHandlers(entries: Record<string, EventHandler>): void {
  for (const [type, handler] of Object.entries(entries)) {
    handlers.set(type, handler);
  }
}

export function dispatchEvent(event: ParsedTaskEvent, ctx: StreamContext): void {
  const handler = handlers.get(event.type);
  if (handler) {
    handler(event, ctx);
  } else if (import.meta.env.DEV) {
    console.debug(`[SSE] Unhandled event type: ${event.type}`, event);
  }
}
