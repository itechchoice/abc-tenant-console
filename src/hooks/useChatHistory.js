import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/http/client';
import { useChatStore } from '@/stores/chatStore';
import { SessionItemSchema } from '@/schemas/chatSchema';

/**
 * @typedef {import('@/schemas/chatSchema').Message} Message
 * @typedef {import('@/schemas/chatSchema').SessionItem} SessionItem
 */

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const chatQueryKeys = {
  sessions: ['sessions'],
  /** @param {string} id */
  sessionDetail: (id) => ['sessions', id],
  /** Legacy alias — points to the same key so existing invalidation works. */
  conversations: ['sessions'],
};

// ---------------------------------------------------------------------------
// useSessions — sidebar session list
// ---------------------------------------------------------------------------

/**
 * Fetches the list of active sessions for the sidebar.
 *
 * Response is validated through the `SessionItemSchema` Zod guard.
 * Falls back to raw data if schema validation fails (defensive parsing).
 *
 * @returns {import('@tanstack/react-query').UseQueryResult<SessionItem[]>}
 */
export function useSessions() {
  return useQuery({
    queryKey: chatQueryKeys.sessions,
    queryFn: async () => {
      const res = await apiClient.get('/sessions');
      const raw = Array.isArray(res) ? res : (res?.data ?? []);
      try {
        return z.array(SessionItemSchema).parse(raw);
      } catch (err) {
        console.warn('[useSessions] Zod validation fell through — returning raw:', err);
        return raw;
      }
    },
  });
}

/** @deprecated Use {@link useSessions} instead. Kept for backward compatibility. */
export const useConversations = useSessions;

// ---------------------------------------------------------------------------
// useSessionDetail — loads full session with message history
// ---------------------------------------------------------------------------

/**
 * Fetches the full detail for a single session and synchronises
 * the message list into the global `useChatStore`.
 *
 * When `sessionId` is falsy the query is **disabled**.
 *
 * @param {string | null | undefined} sessionId
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useSessionDetail(sessionId) {
  const query = useQuery({
    queryKey: chatQueryKeys.sessionDetail(sessionId ?? ''),
    queryFn: async () => {
      const res = await apiClient.get(`/sessions/${sessionId}`);
      return res?.data ?? res;
    },
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (!query.data?.messages) return;
    const store = useChatStore.getState();
    store.setMessages(query.data.messages);
    store.setHasMore(query.data.hasMore ?? false);
  }, [query.data]);

  return query;
}

/** @deprecated Use {@link useSessionDetail} instead. */
export const useConversationDetail = useSessionDetail;
