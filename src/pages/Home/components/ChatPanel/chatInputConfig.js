export const CHAT_MODES = [
  { value: 'auto', label: 'Auto' },
  { value: 'agent', label: 'Agent' },
  { value: 'model', label: 'Model' },
];

export const MODE_GLOW = {
  auto: 'shadow-[0_1px_8px_rgba(0,0,0,0.04)] focus-within:shadow-[0_2px_16px_rgba(0,0,0,0.06)]',
  agent: 'shadow-[0_1px_10px_rgba(217,170,75,0.08)] focus-within:shadow-[0_2px_20px_rgba(217,170,75,0.13)]',
  model: 'shadow-[0_1px_10px_rgba(56,152,236,0.08)] focus-within:shadow-[0_2px_20px_rgba(56,152,236,0.13)]',
};

export const MODE_TAB_ACTIVE = {
  auto: 'bg-background text-foreground shadow-sm',
  agent: 'bg-amber-50 text-amber-700 shadow-sm dark:bg-amber-950/40 dark:text-amber-400',
  model: 'bg-sky-50 text-sky-700 shadow-sm dark:bg-sky-950/40 dark:text-sky-400',
};

export const ENABLE_MODE_BURST = true;

export const MODE_BURST_COLOR = {
  auto: 'transparent',
  agent: 'rgba(217,170,75,0.45)',
  model: 'rgba(56,152,236,0.45)',
};
