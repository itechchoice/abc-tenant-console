import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useModelManagerStore } from '@/stores/modelManagerStore';
import { usePoolDetail } from '../hooks/usePoolDetail';
import { useCreatePool, useUpdatePool } from '../hooks/usePoolMutations';
import { POOL_STRATEGIES } from '@/schemas/modelManagerSchema';
import type { PoolStrategy } from '@/schemas/modelManagerSchema';

const DEFAULTS = { poolName: '', strategy: 'ROUND_ROBIN' as PoolStrategy };

export default function PoolFormDialog() {
  const { poolFormDialog, closePoolForm } = useModelManagerStore();
  const { open, mode, id } = poolFormDialog;
  const isEdit = mode === 'edit';

  const { data: existing } = usePoolDetail(isEdit ? id : undefined);
  const createMut = useCreatePool();
  const updateMut = useUpdatePool();

  const [form, setForm] = useState(DEFAULTS);

  useEffect(() => {
    if (!open) return;
    if (isEdit && existing) {
      setForm({ poolName: existing.poolName, strategy: existing.strategy });
    } else if (!isEdit) {
      setForm(DEFAULTS);
    }
  }, [open, isEdit, existing]);

  const handleSubmit = () => {
    if (isEdit && id) {
      updateMut.mutate({ id, payload: form }, { onSuccess: closePoolForm });
    } else {
      createMut.mutate(form, { onSuccess: closePoolForm });
    }
  };

  const submitting = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) closePoolForm(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Pool' : 'Create Pool'}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Pool Name <span className="text-destructive">*</span></Label>
            <Input value={form.poolName} onChange={(e) => setForm((p) => ({ ...p, poolName: e.target.value }))} placeholder="e.g. gpt-pool" />
          </div>
          <div className="space-y-2">
            <Label>Strategy <span className="text-destructive">*</span></Label>
            <Select value={form.strategy} onValueChange={(v) => setForm((p) => ({ ...p, strategy: v as PoolStrategy }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {POOL_STRATEGIES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <span>{s.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{s.desc}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={closePoolForm}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.poolName}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
