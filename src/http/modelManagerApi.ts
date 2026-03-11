import { apiClient, type ApiResponse, unwrap } from './client';
import type {
  AddPoolMemberPayload,
  CreateModelPayload,
  CreatePoolPayload,
  CreateProviderPayload,
  ModelPool,
  ModelResponse,
  PageResponse,
  PoolMember,
  Provider,
  UpdateModelPayload,
  UpdatePoolPayload,
  UpdateProviderPayload,
} from '@/schemas/modelManagerSchema';

// ---------------------------------------------------------------------------
// Raw record mapping helpers
// ---------------------------------------------------------------------------

type RawRecord = Record<string, unknown>;

function toOptionalNumber(value: unknown) {
  return value == null ? undefined : Number(value);
}

function toOptionalString(value: unknown) {
  return value == null ? undefined : String(value);
}

function toObjectRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function mapProvider(raw: RawRecord): Provider {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    providerType: raw.providerType as Provider['providerType'],
    baseUrl: String(raw.baseUrl ?? ''),
    enabled: Boolean(raw.enabled),
    configJson: toObjectRecord(raw.configJson),
    hasApiKey: Boolean(raw.hasApiKey),
    createdBy: toOptionalNumber(raw.createdBy),
    updatedBy: toOptionalNumber(raw.updatedBy),
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
  };
}

function mapModel(raw: RawRecord): ModelResponse {
  return {
    id: String(raw.id ?? ''),
    providerId: String(raw.providerId ?? ''),
    modelId: String(raw.modelId ?? ''),
    displayName: toOptionalString(raw.displayName),
    modelType: raw.modelType as ModelResponse['modelType'],
    enabled: Boolean(raw.enabled),
    inputPricePer1kTokens: toOptionalNumber(raw.inputPricePer1kTokens),
    outputPricePer1kTokens: toOptionalNumber(raw.outputPricePer1kTokens),
    configJson: toObjectRecord(raw.configJson),
    createdBy: toOptionalNumber(raw.createdBy),
    updatedBy: toOptionalNumber(raw.updatedBy),
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
  };
}

function mapPool(raw: RawRecord): ModelPool {
  return {
    id: String(raw.id ?? ''),
    poolName: String(raw.poolName ?? ''),
    strategy: raw.strategy as ModelPool['strategy'],
    enabled: Boolean(raw.enabled),
    createdBy: toOptionalNumber(raw.createdBy),
    updatedBy: toOptionalNumber(raw.updatedBy),
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
  };
}

function mapPoolMember(raw: RawRecord): PoolMember {
  return {
    id: String(raw.id ?? ''),
    poolId: String(raw.poolId ?? ''),
    modelId: String(raw.modelId ?? ''),
    modelName: String(raw.modelName ?? ''),
    priority: Number(raw.priority ?? 0),
    weight: Number(raw.weight ?? 1),
  };
}

function mapPage<T>(raw: RawRecord, itemMapper: (item: RawRecord) => T): PageResponse<T> {
  const content = Array.isArray(raw.content)
    ? raw.content.map((item: unknown) => itemMapper(item as RawRecord))
    : [];

  return {
    content,
    totalElements: Number(raw.totalElements ?? 0),
    totalPages: Number(raw.totalPages ?? 0),
    size: Number(raw.size ?? content.length),
    number: Number(raw.number ?? 0),
    first: Boolean(raw.first),
    last: Boolean(raw.last),
    empty: Boolean(raw.empty),
  };
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

const PROVIDERS = '/admin/providers';
const MODELS = '/admin/models';
const POOLS = '/admin/pools';

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

export async function fetchProviders(params: {
  page?: number;
  size?: number;
  name?: string;
  providerType?: string;
} = {}): Promise<PageResponse<Provider>> {
  const res: ApiResponse<RawRecord> = await apiClient.get(PROVIDERS, {
    params: {
      page: params.page,
      size: params.size,
      providerType: params.providerType,
      name: params.name,
      sort: 'createdAt,desc',
    },
  });
  return mapPage(unwrap(res), mapProvider);
}

export async function fetchProviderDetail(id: string): Promise<Provider> {
  const res: ApiResponse<RawRecord> = await apiClient.get(`${PROVIDERS}/${id}`);
  return mapProvider(unwrap(res));
}

export async function createProvider(payload: CreateProviderPayload): Promise<Provider> {
  const res: ApiResponse<RawRecord> = await apiClient.post(PROVIDERS, payload);
  return mapProvider(unwrap(res));
}

export async function updateProvider(id: string, payload: UpdateProviderPayload): Promise<Provider> {
  const res: ApiResponse<RawRecord> = await apiClient.put(`${PROVIDERS}/${id}`, payload);
  return mapProvider(unwrap(res));
}

export async function deleteProvider(id: string): Promise<void> {
  const res: ApiResponse<null> = await apiClient.delete(`${PROVIDERS}/${id}`);
  unwrap(res);
}

export async function updateProviderStatus(id: string, enabled: boolean): Promise<Provider> {
  const res: ApiResponse<RawRecord> = await apiClient.patch(`${PROVIDERS}/${id}/status`, { enabled });
  return mapProvider(unwrap(res));
}

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

export async function createModelForProvider(providerId: string, payload: CreateModelPayload): Promise<ModelResponse> {
  const res: ApiResponse<RawRecord> = await apiClient.post(`${PROVIDERS}/${providerId}/models`, payload);
  return mapModel(unwrap(res));
}

export async function fetchModelsByProvider(
  providerId: string,
  params: { page?: number; size?: number } = {},
): Promise<PageResponse<ModelResponse>> {
  const res: ApiResponse<RawRecord> = await apiClient.get(`${PROVIDERS}/${providerId}/models`, {
    params: {
      page: params.page,
      size: params.size,
      sort: 'createdAt,desc',
    },
  });
  return mapPage(unwrap(res), mapModel);
}

export async function fetchAllModels(params: {
  page?: number;
  size?: number;
  modelType?: string;
  enabled?: boolean;
} = {}): Promise<PageResponse<ModelResponse>> {
  const res: ApiResponse<RawRecord> = await apiClient.get(MODELS, {
    params: {
      page: params.page,
      size: params.size,
      modelType: params.modelType,
      enabled: params.enabled,
      sort: 'createdAt,desc',
    },
  });
  return mapPage(unwrap(res), mapModel);
}

export async function fetchModelDetail(id: string): Promise<ModelResponse> {
  const res: ApiResponse<RawRecord> = await apiClient.get(`${MODELS}/${id}`);
  return mapModel(unwrap(res));
}

export async function updateModel(id: string, payload: UpdateModelPayload): Promise<ModelResponse> {
  const res: ApiResponse<RawRecord> = await apiClient.put(`${MODELS}/${id}`, payload);
  return mapModel(unwrap(res));
}

export async function deleteModel(id: string): Promise<void> {
  const res: ApiResponse<null> = await apiClient.delete(`${MODELS}/${id}`);
  unwrap(res);
}

export async function updateModelStatus(id: string, enabled: boolean): Promise<ModelResponse> {
  const res: ApiResponse<RawRecord> = await apiClient.patch(`${MODELS}/${id}/status`, { enabled });
  return mapModel(unwrap(res));
}

// ---------------------------------------------------------------------------
// Pools
// ---------------------------------------------------------------------------

export async function fetchPools(): Promise<ModelPool[]> {
  const res: ApiResponse<RawRecord[]> = await apiClient.get(POOLS);
  return unwrap(res).map((item) => mapPool(item));
}

export async function fetchPoolDetail(id: string): Promise<ModelPool> {
  const res: ApiResponse<RawRecord> = await apiClient.get(`${POOLS}/${id}`);
  return mapPool(unwrap(res));
}

export async function createPool(payload: CreatePoolPayload): Promise<ModelPool> {
  const res: ApiResponse<RawRecord> = await apiClient.post(POOLS, payload);
  return mapPool(unwrap(res));
}

export async function updatePool(id: string, payload: UpdatePoolPayload): Promise<ModelPool> {
  const res: ApiResponse<RawRecord> = await apiClient.put(`${POOLS}/${id}`, payload);
  return mapPool(unwrap(res));
}

export async function deletePool(id: string): Promise<void> {
  const res: ApiResponse<null> = await apiClient.delete(`${POOLS}/${id}`);
  unwrap(res);
}

export async function fetchPoolMembers(poolId: string): Promise<PoolMember[]> {
  const res: ApiResponse<RawRecord[]> = await apiClient.get(`${POOLS}/${poolId}/members`);
  return unwrap(res).map((item) => mapPoolMember(item));
}

export async function addPoolMember(poolId: string, payload: AddPoolMemberPayload): Promise<PoolMember> {
  const res: ApiResponse<RawRecord> = await apiClient.post(`${POOLS}/${poolId}/members`, payload);
  return mapPoolMember(unwrap(res));
}

export async function removePoolMember(poolId: string, memberId: string): Promise<void> {
  const res: ApiResponse<null> = await apiClient.delete(`${POOLS}/${poolId}/members/${memberId}`);
  unwrap(res);
}
