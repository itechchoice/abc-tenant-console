import type { ModelType, ProviderType } from '@/schemas/modelManagerSchema';

export interface ModelPreset {
  modelId: string;
  displayName: string;
  modelType: ModelType;
  inputPricePer1kTokens?: number;
  outputPricePer1kTokens?: number;
}

export const MODEL_PRESETS: Record<ProviderType, ModelPreset[]> = {
  OPENAI: [
    { modelId: 'gpt-4o', displayName: 'GPT-4o', modelType: 'CHAT', inputPricePer1kTokens: 0.005, outputPricePer1kTokens: 0.015 },
    { modelId: 'gpt-4o-mini', displayName: 'GPT-4o Mini', modelType: 'CHAT', inputPricePer1kTokens: 0.00015, outputPricePer1kTokens: 0.0006 },
    { modelId: 'gpt-4.1', displayName: 'GPT-4.1', modelType: 'CHAT', inputPricePer1kTokens: 0.002, outputPricePer1kTokens: 0.008 },
    { modelId: 'gpt-4.1-mini', displayName: 'GPT-4.1 Mini', modelType: 'CHAT', inputPricePer1kTokens: 0.0004, outputPricePer1kTokens: 0.0016 },
    { modelId: 'gpt-4.1-nano', displayName: 'GPT-4.1 Nano', modelType: 'CHAT', inputPricePer1kTokens: 0.0001, outputPricePer1kTokens: 0.0004 },
    { modelId: 'o3-mini', displayName: 'o3 Mini', modelType: 'CHAT', inputPricePer1kTokens: 0.0011, outputPricePer1kTokens: 0.0044 },
    { modelId: 'text-embedding-3-large', displayName: 'Embedding 3 Large', modelType: 'EMBEDDING', inputPricePer1kTokens: 0.00013, outputPricePer1kTokens: 0 },
    { modelId: 'text-embedding-3-small', displayName: 'Embedding 3 Small', modelType: 'EMBEDDING', inputPricePer1kTokens: 0.00002, outputPricePer1kTokens: 0 },
  ],
  ANTHROPIC: [
    { modelId: 'claude-sonnet-4-20250514', displayName: 'Claude Sonnet 4', modelType: 'CHAT', inputPricePer1kTokens: 0.003, outputPricePer1kTokens: 0.015 },
    { modelId: 'claude-3-5-haiku-20241022', displayName: 'Claude 3.5 Haiku', modelType: 'CHAT', inputPricePer1kTokens: 0.0008, outputPricePer1kTokens: 0.004 },
    { modelId: 'claude-3-haiku-20240307', displayName: 'Claude 3 Haiku', modelType: 'CHAT', inputPricePer1kTokens: 0.00025, outputPricePer1kTokens: 0.00125 },
  ],
  GEMINI: [
    { modelId: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', modelType: 'CHAT', inputPricePer1kTokens: 0.00125, outputPricePer1kTokens: 0.01 },
    { modelId: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', modelType: 'CHAT', inputPricePer1kTokens: 0.00015, outputPricePer1kTokens: 0.0006 },
    { modelId: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', modelType: 'CHAT', inputPricePer1kTokens: 0.0001, outputPricePer1kTokens: 0.0004 },
    { modelId: 'text-embedding-004', displayName: 'Text Embedding 004', modelType: 'EMBEDDING', inputPricePer1kTokens: 0.00001, outputPricePer1kTokens: 0 },
  ],
};

export const CUSTOM_PRESET_VALUE = '__custom__';
