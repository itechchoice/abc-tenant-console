import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { UsageByModel } from '@/schemas/tokenQuotaSchema';

interface Props {
  data: UsageByModel[] | undefined;
  isLoading: boolean;
}

export default function ModelUsageTable({ data, isLoading }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Usage by Model</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">No data</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Requests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.modelId}>
                  <TableCell className="font-medium">{row.modelId}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.totalTokens.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">${row.totalCost.toFixed(4)}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.requestCount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
