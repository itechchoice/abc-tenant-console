import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useModelManagerStore } from '@/stores/modelManagerStore';
import { useModelDetail } from '../hooks/useModels';
import { useCreateModel, useUpdateModel } from '../hooks/useModelMutations';
import { MODEL_TYPES } from '@/schemas/modelManagerSchema';
import type { ModelType } from '@/schemas/modelManagerSchema';

const DEFAULTS = { modelId: '', displayName: '', modelType: 'CHAT' as ModelType, inputPrice: '', outputPrice: '' };

export default function ModelFormDialog() {
  const { modelFormDialog, closeModelForm } = useModelManagerStore();
  const { open, mode, id, parentId } = modelFormDialog;
  const isEdit = mode === 'edit';

  const { data: existing } = useModelDetail(isEdit ? id : undefined);
  const createMut = useCreateModel();
  const updateMut = useUpdateModel();

  const [form, setForm] = useState(DEFAULTS);

  useEffect(() => {
    if (!open) return;
    if (isEdit && existing) {
      setForm({
        modelId: existing.modelId,
        displayName: existing.displayName || '',
        modelType: existing.modelType,
        inputPrice: existing.inputPricePer1kTokens?.toString() || '',
        outputPrice: existing.outputPricePer1kTokens?.toString() || '',
      });
    } else if (!isEdit) {
      setForm(DEFAULTS);
    }
  }, [open, isEdit, existing]);

  const set = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = () => {
    const inp = form.inputPrice ? parseFloat(form.inputPrice) : undefined;
    const out = form.outputPrice ? parseFloat(form.outputPrice) : undefined;

    if (isEdit && id) {
      updateMut.mutate({ id, payload: { displayName: form.displayName || undefined, modelType: form.modelType, inputPricePer1kTokens: inp, outputPricePer1kTokens: out } }, { onSuccess: closeModelForm });
    } else if (parentId) {
      createMut.mutate({ providerId: parentId, payload: { modelId: form.modelId, displayName: form.displayName || undefined, modelType: form.modelType, inputPricePer1kTokens: inp, outputPricePer1kTokens: out } }, { onSuccess: closeModelForm });
    }
  };

  const submitting = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) closeModelForm(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Model' : 'Add Model'}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Model ID <span className="text-destructive">*</span></Label>
            <Input value={form.modelId} onChange={(e) => set('modelId', e.target.value)} placeholder="e.g. gpt-4o-mini" disabled={isEdit} />
          </div>
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={form.displayName} onChange={(e) => set('displayName', e.target.value)} placeholder="Optional display name" />
          </div>
          <div className="space-y-2">
            <Label>Model Type <span className="text-destructive">*</span></Label>
            <Select value={form.modelType} onValueChange={(v) => set('modelType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODEL_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Input Price /1K tokens</Label>
              <Input type="number" step="0.00001" value={form.inputPrice} onChange={(e) => set('inputPrice', e.target.value)} placeholder="$0.00015" />
            </div>
            <div className="space-y-2">
              <Label>Output Price /1K tokens</Label>
              <Input type="number" step="0.00001" value={form.outputPrice} onChange={(e) => set('outputPrice', e.target.value)} placeholder="$0.0006" />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={closeModelForm}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.modelId}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {isEdit ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
