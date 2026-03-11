import type {
  Provider, CreateProviderPayload, UpdateProviderPayload,
  ModelResponse, CreateModelPayload, UpdateModelPayload,
  ModelPool, CreatePoolPayload, UpdatePoolPayload,
  PoolMember, AddPoolMemberPayload, PageResponse,
} from '@/schemas/modelManagerSchema';

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
let nextId = 1000;
const uid = () => String(nextId++);
const now = () => new Date().toISOString();

// ════════════════════════════════════════════
//  Seed data
// ════════════════════════════════════════════

let providers: Provider[] = [
  { id: '1', name: 'OpenAI Production', providerType: 'OPENAI', baseUrl: 'https://api.openai.com', enabled: true, hasApiKey: true, configJson: null, createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z' },
  { id: '2', name: 'Anthropic', providerType: 'ANTHROPIC', baseUrl: 'https://api.anthropic.com', enabled: true, hasApiKey: true, configJson: null, createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z' },
  { id: '3', name: 'Google Gemini', providerType: 'GEMINI', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', enabled: true, hasApiKey: true, configJson: null, createdAt: '2026-02-10T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z' },
];

let models: ModelResponse[] = [
  { id: '101', providerId: '1', modelId: 'gpt-4o', displayName: 'GPT-4o', modelType: 'CHAT', enabled: true, inputPricePer1kTokens: 0.005, outputPricePer1kTokens: 0.015, configJson: { maxContextLength: 128000 }, createdAt: '2026-01-16T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z' },
  { id: '102', providerId: '1', modelId: 'gpt-4o-mini', displayName: 'GPT-4o Mini', modelType: 'CHAT', enabled: true, inputPricePer1kTokens: 0.00015, outputPricePer1kTokens: 0.0006, configJson: { maxContextLength: 128000 }, createdAt: '2026-01-16T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z' },
  { id: '103', providerId: '1', modelId: 'text-embedding-3-large', displayName: 'Embedding 3 Large', modelType: 'EMBEDDING', enabled: true, inputPricePer1kTokens: 0.00013, outputPricePer1kTokens: 0, configJson: null, createdAt: '2026-01-16T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z' },
  { id: '104', providerId: '2', modelId: 'claude-3.5-sonnet', displayName: 'Claude 3.5 Sonnet', modelType: 'CHAT', enabled: true, inputPricePer1kTokens: 0.003, outputPricePer1kTokens: 0.015, configJson: { maxContextLength: 200000 }, createdAt: '2026-02-02T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z' },
  { id: '105', providerId: '2', modelId: 'claude-3-haiku', displayName: 'Claude 3 Haiku', modelType: 'CHAT', enabled: true, inputPricePer1kTokens: 0.00025, outputPricePer1kTokens: 0.00125, configJson: null, createdAt: '2026-02-02T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z' },
  { id: '106', providerId: '3', modelId: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', modelType: 'CHAT', enabled: true, inputPricePer1kTokens: 0.00125, outputPricePer1kTokens: 0.005, configJson: { maxContextLength: 1000000 }, createdAt: '2026-02-11T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z' },
  { id: '107', providerId: '3', modelId: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash', modelType: 'CHAT', enabled: false, inputPricePer1kTokens: 0.000075, outputPricePer1kTokens: 0.0003, configJson: null, createdAt: '2026-02-11T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z' },
];

let pools: ModelPool[] = [
  { id: '201', poolName: 'gpt-pool', strategy: 'ROUND_ROBIN', enabled: true, createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-03-01T10:00:00Z' },
  { id: '202', poolName: 'fast-chat', strategy: 'WEIGHTED', enabled: true, createdAt: '2026-03-02T10:00:00Z', updatedAt: '2026-03-02T10:00:00Z' },
];

let poolMembers: PoolMember[] = [
  { id: '301', poolId: '201', modelId: '101', modelName: 'gpt-4o', priority: 1, weight: 10 },
  { id: '302', poolId: '201', modelId: '102', modelName: 'gpt-4o-mini', priority: 0, weight: 5 },
  { id: '303', poolId: '202', modelId: '102', modelName: 'gpt-4o-mini', priority: 0, weight: 8 },
  { id: '304', poolId: '202', modelId: '105', modelName: 'claude-3-haiku', priority: 0, weight: 6 },
  { id: '305', poolId: '202', modelId: '107', modelName: 'gemini-1.5-flash', priority: 0, weight: 4 },
];

// ════════════════════════════════════════════
//  Helpers
// ════════════════════════════════════════════

function paginate<T>(items: T[], page: number, size: number): PageResponse<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const start = page * size;
  const content = items.slice(start, start + size);
  return { content, totalElements: total, totalPages, size, number: page, first: page === 0, last: page >= totalPages - 1, empty: content.length === 0 };
}

// ════════════════════════════════════════════
//  Provider CRUD (6)
// ════════════════════════════════════════════

export async function fetchProviders(params: { page?: number; size?: number; name?: string; providerType?: string } = {}): Promise<PageResponse<Provider>> {
  await delay();
  const { page = 0, size = 9, name, providerType } = params;
  let list = [...providers];
  if (name) { const q = name.toLowerCase(); list = list.filter((p) => p.name.toLowerCase().includes(q)); }
  if (providerType) list = list.filter((p) => p.providerType === providerType);
  return paginate(list, page, size);
}

export async function fetchProviderDetail(id: string): Promise<Provider> {
  await delay();
  const p = providers.find((x) => x.id === id);
  if (!p) throw new Error('Provider not found');
  return { ...p };
}

export async function createProvider(payload: CreateProviderPayload): Promise<Provider> {
  await delay();
  const p: Provider = {
    id: uid(), name: payload.name, providerType: payload.providerType,
    baseUrl: payload.baseUrl || '', enabled: true,
    hasApiKey: !!payload.apiKey, configJson: payload.configJson || null,
    createdAt: now(), updatedAt: now(),
  };
  providers.push(p);
  return { ...p };
}

export async function updateProvider(id: string, payload: UpdateProviderPayload): Promise<Provider> {
  await delay();
  const idx = providers.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Provider not found');
  const existing = providers[idx];
  providers[idx] = {
    ...existing,
    ...(payload.name !== undefined && { name: payload.name }),
    ...(payload.providerType !== undefined && { providerType: payload.providerType }),
    ...(payload.baseUrl !== undefined && { baseUrl: payload.baseUrl }),
    ...(payload.apiKey !== undefined && { hasApiKey: !!payload.apiKey }),
    ...(payload.configJson !== undefined && { configJson: payload.configJson || null }),
    updatedAt: now(),
  };
  return { ...providers[idx] };
}

export async function deleteProvider(id: string): Promise<void> {
  await delay();
  const providerModels = models.filter((m) => m.providerId === id);
  const modelIds = new Set(providerModels.map((m) => m.id));
  poolMembers = poolMembers.filter((pm) => !modelIds.has(pm.modelId));
  models = models.filter((m) => m.providerId !== id);
  providers = providers.filter((p) => p.id !== id);
}

export async function updateProviderStatus(id: string, enabled: boolean): Promise<Provider> {
  await delay();
  const idx = providers.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Provider not found');
  providers[idx] = { ...providers[idx], enabled, updatedAt: now() };
  return { ...providers[idx] };
}

// ════════════════════════════════════════════
//  Model CRUD (7)
// ════════════════════════════════════════════

export async function createModelForProvider(providerId: string, payload: CreateModelPayload): Promise<ModelResponse> {
  await delay();
  const m: ModelResponse = {
    id: uid(), providerId, modelId: payload.modelId,
    displayName: payload.displayName || payload.modelId,
    modelType: payload.modelType, enabled: true,
    inputPricePer1kTokens: payload.inputPricePer1kTokens,
    outputPricePer1kTokens: payload.outputPricePer1kTokens,
    configJson: payload.configJson || null,
    createdAt: now(), updatedAt: now(),
  };
  models.push(m);
  return { ...m };
}

export async function fetchModelsByProvider(providerId: string, params: { page?: number; size?: number } = {}): Promise<PageResponse<ModelResponse>> {
  await delay();
  const { page = 0, size = 20 } = params;
  const list = models.filter((m) => m.providerId === providerId);
  return paginate(list, page, size);
}

export async function fetchAllModels(params: { page?: number; size?: number; modelType?: string; enabled?: boolean } = {}): Promise<PageResponse<ModelResponse>> {
  await delay();
  const { page = 0, size = 50, modelType, enabled } = params;
  let list = [...models];
  if (modelType) list = list.filter((m) => m.modelType === modelType);
  if (enabled !== undefined) list = list.filter((m) => m.enabled === enabled);
  return paginate(list, page, size);
}

export async function fetchModelDetail(id: string): Promise<ModelResponse> {
  await delay();
  const m = models.find((x) => x.id === id);
  if (!m) throw new Error('Model not found');
  return { ...m };
}

export async function updateModel(id: string, payload: UpdateModelPayload): Promise<ModelResponse> {
  await delay();
  const idx = models.findIndex((m) => m.id === id);
  if (idx === -1) throw new Error('Model not found');
  const existing = models[idx];
  models[idx] = {
    ...existing,
    ...(payload.displayName !== undefined && { displayName: payload.displayName }),
    ...(payload.modelType !== undefined && { modelType: payload.modelType }),
    ...(payload.inputPricePer1kTokens !== undefined && { inputPricePer1kTokens: payload.inputPricePer1kTokens }),
    ...(payload.outputPricePer1kTokens !== undefined && { outputPricePer1kTokens: payload.outputPricePer1kTokens }),
    ...(payload.configJson !== undefined && { configJson: payload.configJson || null }),
    updatedAt: now(),
  };
  return { ...models[idx] };
}

export async function deleteModel(id: string): Promise<void> {
  await delay();
  poolMembers = poolMembers.filter((pm) => pm.modelId !== id);
  models = models.filter((m) => m.id !== id);
}

export async function updateModelStatus(id: string, enabled: boolean): Promise<ModelResponse> {
  await delay();
  const idx = models.findIndex((m) => m.id === id);
  if (idx === -1) throw new Error('Model not found');
  models[idx] = { ...models[idx], enabled, updatedAt: now() };
  return { ...models[idx] };
}

// ════════════════════════════════════════════
//  Pool CRUD (5)
// ════════════════════════════════════════════

export async function fetchPools(): Promise<ModelPool[]> {
  await delay();
  return pools.map((p) => ({ ...p }));
}

export async function fetchPoolDetail(id: string): Promise<ModelPool> {
  await delay();
  const p = pools.find((x) => x.id === id);
  if (!p) throw new Error('Pool not found');
  return { ...p };
}

export async function createPool(payload: CreatePoolPayload): Promise<ModelPool> {
  await delay();
  const p: ModelPool = { id: uid(), poolName: payload.poolName, strategy: payload.strategy, enabled: true, createdAt: now(), updatedAt: now() };
  pools.push(p);
  return { ...p };
}

export async function updatePool(id: string, payload: UpdatePoolPayload): Promise<ModelPool> {
  await delay();
  const idx = pools.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Pool not found');
  pools[idx] = {
    ...pools[idx],
    ...(payload.poolName !== undefined && { poolName: payload.poolName }),
    ...(payload.strategy !== undefined && { strategy: payload.strategy }),
    updatedAt: now(),
  };
  return { ...pools[idx] };
}

export async function deletePool(id: string): Promise<void> {
  await delay();
  poolMembers = poolMembers.filter((pm) => pm.poolId !== id);
  pools = pools.filter((p) => p.id !== id);
}

// ════════════════════════════════════════════
//  Pool Members (3)
// ════════════════════════════════════════════

export async function fetchPoolMembers(poolId: string): Promise<PoolMember[]> {
  await delay();
  return poolMembers.filter((pm) => pm.poolId === poolId).map((pm) => ({ ...pm }));
}

export async function addPoolMember(poolId: string, payload: AddPoolMemberPayload): Promise<PoolMember> {
  await delay();
  const model = models.find((m) => m.id === payload.modelId);
  const pm: PoolMember = {
    id: uid(), poolId, modelId: payload.modelId,
    modelName: model?.modelId || payload.modelId,
    priority: payload.priority ?? 0, weight: payload.weight ?? 1,
  };
  poolMembers.push(pm);
  return { ...pm };
}

export async function removePoolMember(poolId: string, memberId: string): Promise<void> {
  await delay();
  poolMembers = poolMembers.filter((pm) => !(pm.poolId === poolId && pm.id === memberId));
}
