import {
  GitBranch,
  MessageSquareQuote,
  Orbit,
  Wrench,
} from 'lucide-react';

export const FIT_VIEW_OPTS = {
  duration: 260,
  maxZoom: 1.08,
  padding: 0.45,
};

export const AGENT_BLUEPRINT = [
  {
    id: 'understand',
    position: { x: 40, y: 40 },
    label: 'Understand',
    subtitle: 'Intent parsing',
    type: 'analysis',
    detail: 'Interpreting the user request and context.',
  },
  {
    id: 'plan',
    position: { x: 220, y: 146 },
    label: 'Plan',
    subtitle: 'Execution route',
    type: 'plan',
    detail: 'Choosing the path and preparing the task.',
  },
  {
    id: 'retrieve',
    position: { x: 64, y: 276 },
    label: 'Retrieve',
    subtitle: 'Tool calls',
    type: 'tool',
    detail: 'Collecting external evidence and tool output.',
  },
  {
    id: 'decide',
    position: { x: 224, y: 410 },
    label: 'Decide',
    subtitle: 'Synthesis',
    type: 'decision',
    detail: 'Combining evidence into a final decision.',
  },
  {
    id: 'ask-user',
    position: { x: 52, y: 552 },
    label: 'Ask User',
    subtitle: 'Human checkpoint',
    type: 'handoff',
    detail: 'Pausing for a missing confirmation or form input.',
  },
  {
    id: 'respond',
    position: { x: 232, y: 678 },
    label: 'Respond',
    subtitle: 'Answer delivery',
    type: 'response',
    detail: 'Streaming the final answer back to the chat.',
  },
];

export const AGENT_EDGES = [
  { id: 'understand-plan', source: 'understand', target: 'plan' },
  { id: 'plan-retrieve', source: 'plan', target: 'retrieve' },
  { id: 'retrieve-decide', source: 'retrieve', target: 'decide' },
  { id: 'decide-respond', source: 'decide', target: 'respond' },
  { id: 'decide-ask-user', source: 'decide', target: 'ask-user' },
  { id: 'ask-user-respond', source: 'ask-user', target: 'respond' },
];

export const MODEL_BLUEPRINT = [
  {
    id: 'prompt',
    position: { x: 48, y: 84 },
    label: 'Prompt',
    subtitle: 'Request framing',
    type: 'analysis',
    detail: 'Preparing the prompt and request metadata.',
  },
  {
    id: 'model',
    position: { x: 218, y: 224 },
    label: 'Model',
    subtitle: 'Inference',
    type: 'model',
    detail: 'Running the selected model directly.',
  },
  {
    id: 'response',
    position: { x: 48, y: 382 },
    label: 'Response',
    subtitle: 'Delivery',
    type: 'response',
    detail: 'Streaming the answer into the conversation.',
  },
];

export const MODEL_EDGES = [
  { id: 'prompt-model', source: 'prompt', target: 'model' },
  { id: 'model-response', source: 'model', target: 'response' },
];

export const MODE_LABELS = {
  auto: 'Auto',
  agent: 'Agent',
  model: 'Model',
};

export const STATUS_LABELS = {
  idle: 'Idle',
  preparing: 'Preparing execution',
  running: 'Running',
  waiting: 'Waiting for your input',
  completed: 'Completed',
  failed: 'Failed',
};

export const STATUS_TONES = {
  idle: 'bg-white/80 text-slate-600 border-slate-200/70',
  preparing: 'bg-slate-900 text-white border-slate-900',
  running: 'bg-sky-50 text-sky-700 border-sky-200',
  waiting: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
};

export const TIMELINE_ICONS = {
  phase: GitBranch,
  tool: Wrench,
  interaction: MessageSquareQuote,
  system: Orbit,
};
