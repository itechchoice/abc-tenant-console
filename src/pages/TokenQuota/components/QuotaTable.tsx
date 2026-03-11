import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, /* Pencil, */ RotateCcw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Quota } from '@/schemas/tokenQuotaSchema';

interface Props {
  data: Quota[] | undefined;
  isLoading: boolean;
  onEdit?: (quota: Quota) => void;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
  resettingId: string | null;
}

export default function QuotaTable({ data, isLoading, onEdit: _onEdit, onReset, onDelete, resettingId }: Props) {
  const rows = useMemo(() => data ?? [], [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!rows.length) {
    return <p className="text-sm text-muted-foreground text-center py-12">No quotas configured</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Token Limit</TableHead>
          <TableHead className="text-right">Used</TableHead>
          <TableHead>Usage</TableHead>
          <TableHead>Period Start</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((q) => {
          const pct = q.tokenLimit > 0 ? Math.min(100, (q.tokensUsed / q.tokenLimit) * 100) : 0;
          const exceeded = pct >= 100;
          return (
            <TableRow key={q.id}>
              <TableCell>
                <Badge variant="outline">{q.quotaType}</Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">{q.tokenLimit.toLocaleString()}</TableCell>
              <TableCell className="text-right tabular-nums">{q.tokensUsed.toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Progress
                    value={pct}
                    className={cn('h-2 flex-1', exceeded && '[&>div]:bg-destructive')}
                  />
                  <span className="text-xs tabular-nums w-10 text-right">{pct.toFixed(0)}%</span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{q.periodStart}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {/* Edit button — hidden until backend supports PUT /quotas/{id}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit(q)}
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onReset(q.id)}
                    disabled={resettingId === q.id}
                    title="Reset usage"
                  >
                    {resettingId === q.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onDelete(q.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
