import { Card, CardContent } from '@/components/ui/card';
import { Zap, DollarSign, Hash, ArrowUpDown } from 'lucide-react';
import type { UsageSummary } from '@/schemas/tokenQuotaSchema';

function fmt(n: number) {
  return n.toLocaleString();
}

interface Props {
  data: UsageSummary | undefined;
  isLoading: boolean;
}

export default function UsageSummaryCards({ data, isLoading }: Props) {
  const cards = [
    {
      label: 'Total Tokens',
      value: data ? fmt(data.totalTokens) : '—',
      icon: Zap,
      sub: data ? `Prompt ${fmt(data.promptTokens)} / Completion ${fmt(data.completionTokens)}` : undefined,
    },
    {
      label: 'Total Cost',
      value: data ? `$${data.totalCost.toFixed(4)}` : '—',
      icon: DollarSign,
    },
    {
      label: 'Requests',
      value: data ? fmt(data.requestCount) : '—',
      icon: Hash,
    },
    {
      label: 'Avg Tokens / Request',
      value: data && data.requestCount > 0
        ? fmt(Math.round(data.totalTokens / data.requestCount))
        : '—',
      icon: ArrowUpDown,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="pt-5 pb-4 px-5">
            {isLoading ? (
              <div className="h-14 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <c.icon className="h-4 w-4" />
                  {c.label}
                </div>
                <div className="text-2xl font-bold tracking-tight tabular-nums">{c.value}</div>
                {c.sub && (
                  <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
