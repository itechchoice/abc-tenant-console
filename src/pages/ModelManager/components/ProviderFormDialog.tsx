import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useModelManagerStore } from '@/stores/modelManagerStore';
import { useProviderDetail } from '../hooks/useProviderDetail';
import { useCreateProvider, useUpdateProvider } from '../hooks/useProviderMutations';
import { PROVIDER_TYPES } from '@/schemas/modelManagerSchema';
import type { ProviderType } from '@/schemas/modelManagerSchema';

const DEFAULTS = { name: '', providerType: 'OPENAI' as ProviderType, baseUrl: '', apiKey: '' };

export default function ProviderFormDialog() {
  const { providerFormDialog, closeProviderForm } = useModelManagerStore();
  const { open, mode, id } = providerFormDialog;
  const isEdit = mode === 'edit';

  const { data: existing } = useProviderDetail(isEdit ? id : undefined);
  const createMut = useCreateProvider();
  const updateMut = useUpdateProvider();

  const [form, setForm] = useState(DEFAULTS);

  useEffect(() => {
    if (!open) return;
    if (isEdit && existing) {
      setForm({ name: existing.name, providerType: existing.providerType, baseUrl: existing.baseUrl, apiKey: '' });
    } else if (!isEdit) {
      setForm(DEFAULTS);
    }
  }, [open, isEdit, existing]);

  const set = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = () => {
    if (isEdit && id) {
      updateMut.mutate({ id, payload: { ...form, apiKey: form.apiKey || undefined } }, { onSuccess: closeProviderForm });
    } else {
      createMut.mutate({ ...form, apiKey: form.apiKey || undefined }, { onSuccess: closeProviderForm });
    }
  };

  const submitting = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) closeProviderForm(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Provider' : 'Create Provider'}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. OpenAI Production" />
          </div>
          <div className="space-y-2">
            <Label>Provider Type <span className="text-destructive">*</span></Label>
            <Select value={form.providerType} onValueChange={(v) => set('providerType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROVIDER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Base URL</Label>
            <Input value={form.baseUrl} onChange={(e) => set('baseUrl', e.target.value)} placeholder="Leave empty for default" />
          </div>
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input type="password" autoComplete="off" value={form.apiKey} onChange={(e) => set('apiKey', e.target.value)} placeholder={isEdit ? 'Leave empty to keep current' : 'sk-...'} />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={closeProviderForm}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.name}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
