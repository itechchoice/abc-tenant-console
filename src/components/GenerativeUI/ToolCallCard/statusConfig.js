import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export const STATUS_CONFIG = {
  pending: {
    icon: Loader2,
    iconClass: 'animate-spin text-blue-500',
    label: 'Executing tool...',
    ringClass: 'border-blue-200 dark:border-blue-900/40',
    bgClass: 'bg-blue-50/60 dark:bg-blue-950/20',
  },
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
    label: 'Tool executed successfully',
    ringClass: 'border-emerald-200 dark:border-emerald-900/40',
    bgClass: 'bg-emerald-50/50 dark:bg-emerald-950/20',
  },
  error: {
    icon: AlertTriangle,
    iconClass: 'text-red-500',
    label: 'Tool execution failed',
    ringClass: 'border-red-200 dark:border-red-900/40',
    bgClass: 'bg-red-50/50 dark:bg-red-950/20',
  },
};
