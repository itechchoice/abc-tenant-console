import { cn } from '@/lib/utils';

export const inputClasses = cn(
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
  'text-sm text-foreground placeholder:text-muted-foreground',
  'transition-colors focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50',
);

export const labelClasses = 'mb-1.5 block text-sm font-medium text-foreground/80';

export const buttonBase = cn(
  'inline-flex items-center justify-center rounded-md text-sm font-medium',
  'h-10 px-4 py-2 transition-colors focus-visible:outline-none',
  'focus-visible:ring-2 focus-visible:ring-ring/40',
  'disabled:pointer-events-none disabled:opacity-50',
);
