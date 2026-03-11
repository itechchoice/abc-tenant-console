import { z } from 'zod';
import { apiClient, type ApiResponse, unwrap } from './client';
import {
  SessionItemSchema,
  normalizeServerMessages,
  type SessionItem,
  type Message,
  type ServerMessageRecord,
} from '@/schemas/chatSchema';

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export interface SessionsQueryParams {
  agentId?: string;
  userId?: string;
  keyword?: string;
  page?: number;
  size?: number;
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface SessionsResponse {
  items: SessionItem[];
  total: number;
  page: number;
  size: number;
}

export interface SessionDetail {
  id: string;
  tenantId?: string;
  userId?: string;
  title?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  messages: Message[];
  hasMore: boolean;
}

/** Paginated shape that the backend may use for session lists. */
interface PaginatedSessionData {
  items: SessionItem[];
  total: number;
  page: number;
  size: number;
}

/** Raw session detail data returned by `GET /sessions/{id}`. */
interface SessionDetailData {
  id: string;
  tenantId?: string;
  userId?: string;
  title?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  messages?: ServerMessageRecord[];
  hasMore?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validateSessionItems(raw: SessionItem[]): SessionItem[] {
  try {
    return z.array(SessionItemSchema).parse(raw);
  } catch (err) {
    console.warn('[chatApi] Zod validation fell through — returning raw:', err);
    return raw;
  }
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

/**
 * Backend may return `data` as a raw array or as a paginated object.
 * We handle both defensively.
 */
export async function fetchSessions(params?: SessionsQueryParams): Promise<SessionsResponse> {
  const res: ApiResponse<SessionItem[] | PaginatedSessionData> = await apiClient.get('/sessions', { params });
  const data = unwrap(res);

  if (Array.isArray(data)) {
    const items = validateSessionItems(data);
    return { items, total: items.length, page: 1, size: items.length };
  }

  const items = validateSessionItems(data.items);
  return {
    items,
    total: data.total ?? items.length,
    page: data.page ?? 1,
    size: data.size ?? items.length,
  };
}

export async function fetchSessionDetail(sessionId: string): Promise<SessionDetail> {
  const res: ApiResponse<SessionDetailData> = await apiClient.get(`/sessions/${sessionId}`);
  const raw = unwrap(res);

  return {
    id: raw.id ?? sessionId,
    tenantId: raw.tenantId,
    userId: raw.userId,
    title: raw.title,
    status: raw.status,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    messages: normalizeServerMessages(raw.messages ?? []),
    hasMore: raw.hasMore ?? false,
  };
}

export async function fetchOlderMessages(
  sessionId: string,
  before: string,
  limit = 20,
): Promise<{ messages: Message[]; hasMore: boolean }> {
  const res: ApiResponse<SessionDetailData> = await apiClient.get(`/sessions/${sessionId}`, {
    params: { before, limit },
  });
  const raw = unwrap(res);

  return {
    messages: normalizeServerMessages(raw.messages ?? []),
    hasMore: raw.hasMore ?? false,
  };
}

export async function renameSession(id: string, title: string): Promise<void> {
  const res: ApiResponse<unknown> = await apiClient.put(`/sessions/${id}`, { title });
  unwrap(res);
}

export async function deleteSession(id: string): Promise<void> {
  const res: ApiResponse<null> = await apiClient.delete(`/sessions/${id}`);
  unwrap(res);
}
