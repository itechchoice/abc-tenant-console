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
import { Loader2, Trash2 } from 'lucide-react';
import type { RateLimitRule } from '@/schemas/tokenQuotaSchema';

interface Props {
  data: RateLimitRule[] | undefined;
  isLoading: boolean;
  onDelete: (id: string) => void;
}

export default function RateLimitTable({ data, isLoading, onDelete }: Props) {
  const rows = useMemo(() => data ?? [], [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!rows.length) {
    return <p className="text-sm text-muted-foreground text-center py-12">No rate limit rules configured</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Target Type</TableHead>
          <TableHead>Target ID</TableHead>
          <TableHead className="text-right">RPM Limit</TableHead>
          <TableHead className="text-right">TPM Limit</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>
              <Badge variant={r.targetType === 'TENANT' ? 'default' : 'secondary'}>
                {r.targetType}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{r.targetId || '—'}</TableCell>
            <TableCell className="text-right tabular-nums">
              {r.rpmLimit != null ? r.rpmLimit.toLocaleString() : '—'}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {r.tpmLimit != null ? r.tpmLimit.toLocaleString() : '—'}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(r.id)}
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
