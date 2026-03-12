import { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useModelManagerStore } from '@/stores/modelManagerStore';
import { useModelDetail } from '../hooks/useModels';
import { useCreateModel, useUpdateModel } from '../hooks/useModelMutations';
import { useProviderList } from '../hooks/useProviderList';
import { MODEL_TYPES } from '@/schemas/modelManagerSchema';
import type { ModelType, ProviderType } from '@/schemas/modelManagerSchema';
import { MODEL_PRESETS, CUSTOM_PRESET_VALUE } from '../config/modelPresets';
import type { ModelPreset } from '../config/modelPresets';

interface FormState {
  modelId: string;
  displayName: string;
  modelType: ModelType;
  inputPrice: string;
  outputPrice: string;
}

const DEFAULTS: FormState = { modelId: '', displayName: '', modelType: 'CHAT', inputPrice: '', outputPrice: '' };

function applyPreset(preset: ModelPreset): FormState {
  return {
    modelId: preset.modelId,
    displayName: preset.displayName,
    modelType: preset.modelType,
    inputPrice: preset.inputPricePer1kTokens?.toString() ?? '',
    outputPrice: preset.outputPricePer1kTokens?.toString() ?? '',
  };
}

export default function ModelFormDialog() {
  const { modelFormDialog, closeModelForm } = useModelManagerStore();
  const { open, mode, id, parentId } = modelFormDialog;
  const isEdit = mode === 'edit';

  const { data: existing } = useModelDetail(isEdit ? id : undefined);
  const createMut = useCreateModel();
  const updateMut = useUpdateModel();
  const providerQuery = useProviderList();

  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(CUSTOM_PRESET_VALUE);

  const providers = providerQuery.data?.content ?? [];
  const effectiveProviderId = parentId || selectedProviderId;

  const providerType: ProviderType | undefined = useMemo(() => {
    if (!effectiveProviderId) return undefined;
    return providers.find((p) => p.id === effectiveProviderId)?.providerType;
  }, [effectiveProviderId, providers]);

  const presets = useMemo(
    () => (providerType ? MODEL_PRESETS[providerType] ?? [] : []),
    [providerType],
  );

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
      setSelectedPreset(CUSTOM_PRESET_VALUE);
    } else if (!isEdit) {
      setForm(DEFAULTS);
      setSelectedProviderId('');
      setSelectedPreset(CUSTOM_PRESET_VALUE);
    }
  }, [open, isEdit, existing]);

  useEffect(() => {
    setSelectedPreset(CUSTOM_PRESET_VALUE);
    if (!isEdit) setForm(DEFAULTS);
  }, [effectiveProviderId, isEdit]);

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    if (value === CUSTOM_PRESET_VALUE) {
      setForm(DEFAULTS);
      return;
    }
    const preset = presets.find((p) => p.modelId === value);
    if (preset) setForm(applyPreset(preset));
  };

  const set = (key: keyof FormState, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (key === 'modelId') setSelectedPreset(CUSTOM_PRESET_VALUE);
  };

  const handleSubmit = () => {
    const inp = form.inputPrice ? parseFloat(form.inputPrice) : undefined;
    const out = form.outputPrice ? parseFloat(form.outputPrice) : undefined;

    if (isEdit && id) {
      updateMut.mutate(
        { id, payload: { displayName: form.displayName || undefined, modelType: form.modelType, inputPricePer1kTokens: inp, outputPricePer1kTokens: out } },
        { onSuccess: closeModelForm },
      );
    } else if (effectiveProviderId) {
      createMut.mutate(
        { providerId: effectiveProviderId, payload: { modelId: form.modelId, displayName: form.displayName || undefined, modelType: form.modelType, inputPricePer1kTokens: inp, outputPricePer1kTokens: out } },
        { onSuccess: closeModelForm },
      );
    }
  };

  const submitting = createMut.isPending || updateMut.isPending;
  const canSubmit = !submitting && form.modelId && effectiveProviderId;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) closeModelForm(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Model' : 'Add Model'}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          {!parentId && !isEdit && (
            <div className="space-y-2">
              <Label>Provider <span className="text-destructive">*</span></Label>
              <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                <SelectTrigger><SelectValue placeholder="Select a provider" /></SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.providerType})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!isEdit && presets.length > 0 && (
            <div className="space-y-2">
              <Label>Model Preset</Label>
              <Select value={selectedPreset} onValueChange={handlePresetChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {presets.map((p) => (
                    <SelectItem key={p.modelId} value={p.modelId}>
                      {p.displayName} ({p.modelType})
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM_PRESET_VALUE}>Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {isEdit ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
