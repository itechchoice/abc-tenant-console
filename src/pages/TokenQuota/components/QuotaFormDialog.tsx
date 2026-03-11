import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { QuotaType, CreateQuotaPayload, Quota } from '@/schemas/tokenQuotaSchema';
import { QUOTA_TYPE_OPTIONS } from '@/schemas/tokenQuotaSchema';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateQuotaPayload) => void;
  isPending: boolean;
  editingQuota?: Quota | null;
}

export default function QuotaFormDialog({ open, onOpenChange, onSubmit, isPending, editingQuota }: Props) {
  const [quotaType, setQuotaType] = useState<QuotaType>('MONTHLY');
  const [tokenLimit, setTokenLimit] = useState('100000');

  const isEdit = !!editingQuota;

  useEffect(() => {
    if (open && editingQuota) {
      setQuotaType(editingQuota.quotaType);
      setTokenLimit(String(editingQuota.tokenLimit));
    }
  }, [open, editingQuota]);

  const handleSubmit = useCallback(() => {
    const limit = Math.max(1, Math.floor(Number(tokenLimit) || 0));
    onSubmit({ quotaType, tokenLimit: limit });
  }, [quotaType, tokenLimit, onSubmit]);

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (!v) {
        setQuotaType('MONTHLY');
        setTokenLimit('100000');
      }
      onOpenChange(v);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Token Quota' : 'Create Token Quota'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Quota Type</Label>
            <Select value={quotaType} onValueChange={(v) => setQuotaType(v as QuotaType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUOTA_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Token Limit</Label>
            <Input
              type="number"
              min={1}
              value={tokenLimit}
              onChange={(e) => setTokenLimit(e.target.value)}
              placeholder="e.g. 1000000"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !tokenLimit}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
