import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/http/client';
import { useChatStore } from '@/stores/chatStore';

/**
 * @typedef {import('@/schemas/chatSchema').Message} Message
 */

// ---------------------------------------------------------------------------
// API response typedefs – documents the expected backend contract so that
// every consumer of these Hooks enjoys full IntelliSense.
// ---------------------------------------------------------------------------

/**
 * Summary of a single chat session as returned by `GET /agent/sessions`.
 *
 * @typedef {object} ChatSessionSummary
 * @property {string}  id        – Unique session identifier.
 * @property {string}  title     – Human-readable session title (often the
 *   first user prompt, truncated).
 * @property {number}  createdAt – Unix-epoch ms when the session was created.
 * @property {number}  updatedAt – Unix-epoch ms of the most recent activity.
 */

/**
 * Full session payload returned by `GET /agent/sessions/:id`.
 *
 * @typedef {object} ChatSessionDetail
 * @property {string}    id        – Session identifier (mirrors the URL param).
 * @property {string}    title     – Session title.
 * @property {Message[]} messages  – Chronologically ordered conversation turns.
 * @property {number}    createdAt – Unix-epoch ms.
 * @property {number}    updatedAt – Unix-epoch ms.
 */

// ---------------------------------------------------------------------------
// Query keys – centralised to guarantee cache invalidation consistency.
// ---------------------------------------------------------------------------

export const chatQueryKeys = {
  sessions: ['agent', 'sessions'],
  /** @param {string} id */
  sessionDetail: (id) => ['agent', 'sessions', id],
};

// ---------------------------------------------------------------------------
// useChatSessions
// ---------------------------------------------------------------------------

/**
 * Fetches the paginated list of historical chat sessions for the sidebar.
 *
 * Backed by `GET /agent/sessions` via `apiClient` (token injection and
 * path rewriting handled by the Axios interceptor layer).
 *
 * @returns {import('@tanstack/react-query').UseQueryResult<ChatSessionSummary[]>}
 */
export function useChatSessions() {
  return useQuery({
    queryKey: chatQueryKeys.sessions,
    queryFn: () => apiClient.get('/agent/sessions'),
  });
}

// ---------------------------------------------------------------------------
// useChatDetail
// ---------------------------------------------------------------------------

/**
 * Fetches the full conversation history for a single session and
 * synchronises the result into the global `useChatStore`.
 *
 * When `sessionId` is falsy the query is **disabled** – no network
 * request will fire until a valid ID is provided.
 *
 * @param {string | null | undefined} sessionId
 * @returns {import('@tanstack/react-query').UseQueryResult<ChatSessionDetail>}
 */
export function useChatDetail(sessionId) {
  const query = useQuery({
    queryKey: chatQueryKeys.sessionDetail(sessionId ?? ''),
    queryFn: () => apiClient.get(`/agent/sessions/${sessionId}`),
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (!query.data?.messages) return;
    useChatStore.getState().setMessages(query.data.messages);
  }, [query.data]);

  return query;
}
