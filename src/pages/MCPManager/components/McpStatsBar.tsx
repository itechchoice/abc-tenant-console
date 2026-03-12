import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatItem {
  label: string;
  value: number | string;
  accent?: 'emerald' | 'rose' | 'slate';
}

interface McpStatsBarProps {
  stats: StatItem[];
}

export default function McpStatsBar({ stats }: McpStatsBarProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, type: 'spring', stiffness: 280, damping: 28 }}
          className="rounded-2xl border bg-white px-5 py-4"
        >
          <p className="text-xs text-slate-500">{stat.label}</p>
          <p
            className={cn(
              'mt-1 text-2xl font-semibold tracking-tight',
              stat.accent === 'emerald' && 'text-emerald-600',
              stat.accent === 'rose' && 'text-rose-500',
              (!stat.accent || stat.accent === 'slate') && 'text-slate-900',
            )}
          >
            {stat.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
