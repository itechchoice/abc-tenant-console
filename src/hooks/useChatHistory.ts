import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/http/client';
import { SessionItemSchema } from '@/schemas/chatSchema';
import type { Message, SessionItem } from '@/schemas/chatSchema';

export interface SessionDetail {
  id: string;
  title?: string;
  messages?: (Message & { taskStatus?: string; taskId?: string })[];
  hasMore?: boolean;
}

export const chatQueryKeys = {
  sessions: ['sessions'] as const,
  sessionDetail: (id: string) => ['session-detail', id] as const,
  conversations: ['sessions'] as const,
};

/**
 * Fetches the list of active sessions for the sidebar.
 *
 * Response is validated through the `SessionItemSchema` Zod guard.
 * Falls back to raw data if schema validation fails (defensive parsing).
 */
export function useSessions() {
  return useQuery<SessionItem[]>({
    queryKey: [...chatQueryKeys.sessions],
    queryFn: async () => {
      const res = await apiClient.get('/sessions') as unknown;
      const raw = Array.isArray(res) ? res : ((res as { data?: unknown })?.data ?? []);
      try {
        return z.array(SessionItemSchema).parse(raw);
      } catch (err) {
        console.warn('[useSessions] Zod validation fell through — returning raw:', err);
        return raw as SessionItem[];
      }
    },
  });
}

/**
 * Fetches the full detail for a single session.
 *
 * When `sessionId` is falsy the query is **disabled**.
 */
export function useSessionDetail(sessionId: string | null | undefined) {
  return useQuery<SessionDetail>({
    queryKey: [...chatQueryKeys.sessionDetail(sessionId ?? '')],
    queryFn: async () => {
      const res = await apiClient.get(`/sessions/${sessionId}`) as { data?: unknown };
      return (res?.data ?? res) as SessionDetail;
    },
    enabled: !!sessionId,
  });
}

