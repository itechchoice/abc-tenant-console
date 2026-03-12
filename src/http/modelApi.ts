import { z } from 'zod';
import { llmGatewayApiClient, type ApiResponse, unwrap } from './client';
import { AssignedProviderSchema, type AssignedProvider } from '@/schemas/modelSchema';

// ---------------------------------------------------------------------------
// Chat model selection — user-facing assigned providers
// ---------------------------------------------------------------------------

export async function fetchAssignedProviders(): Promise<AssignedProvider[]> {
  const res: ApiResponse<AssignedProvider[]> = await llmGatewayApiClient.get('/models/providers/assigned');
  const data = unwrap(res);

  try {
    return z.array(AssignedProviderSchema).parse(data);
  } catch (err) {
    console.warn('[fetchAssignedProviders] Zod validation fell through:', err);
    return data;
  }
}
