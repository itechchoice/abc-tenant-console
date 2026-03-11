import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSessions,
  fetchSessionDetail,
  renameSession,
  deleteSession,
  type SessionsQueryParams,
  type SessionsResponse,
  type SessionDetail,
} from '@/http/chatApi';

export type { SessionsQueryParams, SessionsResponse, SessionDetail };

export const chatQueryKeys = {
  sessionsBase: ['sessions'] as const,
  sessions: (params?: SessionsQueryParams) => ['sessions', params] as const,
  sessionDetail: (id: string) => ['session-detail', id] as const,
  conversations: ['sessions'] as const,
};

export function useSessions(params?: SessionsQueryParams) {
  return useQuery<SessionsResponse>({
    queryKey: [...chatQueryKeys.sessions(params)],
    queryFn: () => fetchSessions(params),
  });
}

export function useSessionDetail(sessionId: string | null | undefined) {
  return useQuery<SessionDetail>({
    queryKey: [...chatQueryKeys.sessionDetail(sessionId ?? '')],
    queryFn: () => fetchSessionDetail(sessionId!),
    enabled: !!sessionId,
  });
}

export function useRenameSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      renameSession(id, title),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.sessionsBase });
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.sessionDetail(variables.id) });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.sessionsBase });
    },
  });
}
