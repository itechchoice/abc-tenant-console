import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/http/client';
import { useChatStore } from '@/stores/chatStore';

/**
 * @typedef {import('@/schemas/chatSchema').Message} Message
 */

// ---------------------------------------------------------------------------
// API response typedefs
// ---------------------------------------------------------------------------

/**
 * Summary of a single conversation as returned by `GET /conversations`.
 *
 * @typedef {object} ConversationSummary
 * @property {string}  id        – Unique conversation identifier.
 * @property {string}  agentId   – Associated agent identifier.
 * @property {string}  title     – Human-readable conversation title.
 * @property {number}  createdAt – Unix-epoch ms when the conversation was created.
 * @property {number}  updatedAt – Unix-epoch ms of the most recent activity.
 */

/**
 * Full conversation payload returned by `GET /conversations/{id}`.
 *
 * @typedef {object} ConversationDetail
 * @property {string}    id        – Conversation identifier.
 * @property {string}    title     – Conversation title.
 * @property {Message[]} messages  – Chronologically ordered conversation turns.
 * @property {number}    createdAt – Unix-epoch ms.
 * @property {number}    updatedAt – Unix-epoch ms.
 */

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const chatQueryKeys = {
  conversations: ['conversations'],
  /** @param {string} id */
  conversationDetail: (id) => ['conversations', id],
};

// ---------------------------------------------------------------------------
// useConversations
// ---------------------------------------------------------------------------

/**
 * Fetches the list of historical conversations for the sidebar.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult<ConversationSummary[]>}
 */
export function useConversations() {
  return useQuery({
    queryKey: chatQueryKeys.conversations,
    queryFn: () => apiClient.get('/conversations'),
  });
}

// ---------------------------------------------------------------------------
// useConversationDetail
// ---------------------------------------------------------------------------

/**
 * Fetches the full message history for a single conversation and
 * synchronises the result into the global `useChatStore`.
 *
 * When `sessionId` is falsy the query is **disabled**.
 *
 * @param {string | null | undefined} sessionId
 * @returns {import('@tanstack/react-query').UseQueryResult<ConversationDetail>}
 */
export function useConversationDetail(sessionId) {
  const query = useQuery({
    queryKey: chatQueryKeys.conversationDetail(sessionId ?? ''),
    queryFn: () => apiClient.get(`/conversations/${sessionId}`),
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (!query.data?.messages) return;
    useChatStore.getState().setMessages(query.data.messages);
  }, [query.data]);

  return query;
}
