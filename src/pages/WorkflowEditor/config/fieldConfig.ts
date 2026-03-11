import { Lock, Move, Wrench, Settings, Bot, Cpu } from 'lucide-react';
import { createElement } from 'react';

const iconClass = 'size-3';

export const NODE_FIELDS = [
  {
    key: 'id',
    label: 'Node ID',
    type: 'text' as const,
    rules: [{ required: true, whitespace: true, message: 'Node ID is required' }],
  },
  { key: 'type', label: 'Node Type', type: 'text' as const, readOnly: true },
  {
    key: 'position.x',
    label: 'X',
    type: 'number' as const,
    precision: 2,
    step: 1,
    rules: [{ required: true, message: 'Position X is required' }],
  },
  {
    key: 'position.y',
    label: 'Y',
    type: 'number' as const,
    precision: 2,
    step: 1,
    rules: [{ required: true, message: 'Position Y is required' }],
  },
  // MODEL fields
  { key: 'data.modelId', label: 'Model ID', type: 'text' as const, placeholder: 'e.g. gpt-4o' },
  {
    key: 'data.temperature',
    label: 'Temperature',
    type: 'number' as const,
    precision: 2,
    step: 0.1,
    placeholder: '0.7',
  },
  {
    key: 'data.maxTokens',
    label: 'Max Tokens',
    type: 'number' as const,
    step: 256,
    placeholder: '2048',
  },
  // TOOL fields — format: "serverCode:toolName"
  { key: 'data.tool', label: 'Tool', type: 'text' as const, placeholder: 'e.g. billing:query' },
  // AGENT fields
  { key: 'data.agentId', label: 'Agent ID', type: 'text' as const, placeholder: 'Agent identifier' },
  // Shared fields
  { key: 'data.prompt', label: 'Prompt', type: 'textarea' as const },
  {
    key: 'data.conditionPrompt',
    label: 'Condition Prompt',
    type: 'textarea' as const,
    alwaysShow: true,
    placeholder: 'Execution guard — leave empty to always execute',
  },
];

export const NODE_PROPERTY_GROUPS = [
  { name: 'Node', icon: createElement(Lock, { className: iconClass }), keys: ['id', 'type'] },
  { name: 'Position', icon: createElement(Move, { className: iconClass }), keys: ['position.x', 'position.y'], layout: 'inline' as const },
  { name: 'Model', icon: createElement(Cpu, { className: iconClass }), keys: ['data.modelId', 'data.temperature', 'data.maxTokens'] },
  { name: 'Tool', icon: createElement(Wrench, { className: iconClass }), keys: ['data.tool'] },
  { name: 'Agent', icon: createElement(Bot, { className: iconClass }), keys: ['data.agentId'] },
  { name: 'Configuration', icon: createElement(Settings, { className: iconClass }), keys: ['data.prompt', 'data.conditionPrompt'] },
];

const RF_TO_DSL_PATH: Record<string, string | string[]> = {
  'data.tool': 'config.tool',
  'data.modelId': 'config.modelId',
  'data.agentId': 'config.agentId',
};

export function getReadOnlyDslPaths(fields = NODE_FIELDS): string[] {
  return fields
    .filter((f) => f.readOnly === true)
    .flatMap((f) => {
      const mapped = RF_TO_DSL_PATH[f.key];
      if (mapped) return Array.isArray(mapped) ? mapped : [mapped];
      return [f.key.startsWith('data.') ? f.key.replace(/^data\./, 'config.') : f.key];
    })
    .filter(Boolean);
}

export const NODE_TYPE_LABELS: Record<string, string> = {
  toolNode: 'Tool Node',
  modelNode: 'Model Node',
  agentNode: 'Agent Node',
};
