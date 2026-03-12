import { engineApiClient, type ApiResponse, unwrap } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateTaskData {
  taskId: string;
  sessionId: string;
}

// ---------------------------------------------------------------------------
// Task endpoints (used by chat agent flow)
// ---------------------------------------------------------------------------

export async function createTask(
  payload: Record<string, unknown>,
): Promise<CreateTaskData> {
  const res: ApiResponse<CreateTaskData> = await engineApiClient.post('/tasks', payload);
  return unwrap(res);
}

export async function cancelTask(taskId: string): Promise<void> {
  const res: ApiResponse<null> = await engineApiClient.post(`/tasks/${taskId}/cancel`);
  unwrap(res);
}
