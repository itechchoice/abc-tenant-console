import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/http/client';
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
  sessionDetail: (id) => ['session-detail', id],
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
 * Fetches the full detail for a single session.
 *
 * **Important:** This hook no longer auto-syncs messages into the Zustand
 * store.  Message synchronisation is owned exclusively by the guarded
 * `useEffect` inside `ChatPanel` (keyed by `hasSyncedSessionRef` +
 * `isHistoricalTrack`), preventing React Query background refetches from
 * overwriting in-flight streaming state.
 *
 * When `sessionId` is falsy the query is **disabled**.
 *
 * @param {string | null | undefined} sessionId
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useSessionDetail(sessionId) {
  return useQuery({
    queryKey: chatQueryKeys.sessionDetail(sessionId ?? ''),
    queryFn: async () => {
      const res = await apiClient.get(`/sessions/${sessionId}`);
      return res?.data ?? res;
    },
    enabled: !!sessionId,
  });
}

/** @deprecated Use {@link useSessionDetail} instead. */
export const useConversationDetail = useSessionDetail;
