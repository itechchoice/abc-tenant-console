import { Plus, Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useModelsByProvider } from '../hooks/useModels';
import { useDeleteModel, useUpdateModelStatus } from '../hooks/useModelMutations';
import { useModelManagerStore } from '@/stores/modelManagerStore';
import type { ModelResponse } from '@/schemas/modelManagerSchema';

interface Props { providerId: string }

function PriceCell({ value }: { value?: number }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  return <span>${value.toFixed(5)}</span>;
}

export default function ProviderModelTable({ providerId }: Props) {
  const { data, isLoading } = useModelsByProvider(providerId);
  const { openCreateModel, openEditModel } = useModelManagerStore();
  const deleteMut = useDeleteModel();
  const statusMut = useUpdateModelStatus();

  const models: ModelResponse[] = data?.content ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Models ({models.length})</h4>
        <Button size="sm" variant="outline" onClick={() => openCreateModel(providerId)}>
          <Plus className="h-3.5 w-3.5 mr-1" />Add Model
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
      ) : models.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No models yet. Click "Add Model" to get started.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model ID</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Input /1K</TableHead>
              <TableHead className="text-right">Output /1K</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-xs">{m.modelId}</TableCell>
                <TableCell>{m.displayName || m.modelId}</TableCell>
                <TableCell><Badge variant="secondary" className="text-[10px]">{m.modelType}</Badge></TableCell>
                <TableCell className="text-right text-xs"><PriceCell value={m.inputPricePer1kTokens} /></TableCell>
                <TableCell className="text-right text-xs"><PriceCell value={m.outputPricePer1kTokens} /></TableCell>
                <TableCell>
                  <Badge variant={m.enabled ? 'default' : 'secondary'} className="text-[10px]">
                    {m.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModel(m.id, providerId)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => statusMut.mutate({ id: m.id, enabled: !m.enabled })}
                    >
                      {m.enabled ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => deleteMut.mutate(m.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
