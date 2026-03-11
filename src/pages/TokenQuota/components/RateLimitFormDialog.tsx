import { useState, useCallback, useMemo } from 'react';
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
import type { RateLimitTargetType, CreateRateLimitPayload } from '@/schemas/tokenQuotaSchema';
import { RATE_LIMIT_TARGET_OPTIONS } from '@/schemas/tokenQuotaSchema';
import { useAllModels } from '@/pages/ModelManager/hooks/useModels';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateRateLimitPayload) => void;
  isPending: boolean;
}

export default function RateLimitFormDialog({ open, onOpenChange, onSubmit, isPending }: Props) {
  const [targetType, setTargetType] = useState<RateLimitTargetType>('MODEL');
  const [targetId, setTargetId] = useState('');
  const [rpmLimit, setRpmLimit] = useState('');
  const [tpmLimit, setTpmLimit] = useState('');

  const allModelsQ = useAllModels();
  const modelOptions = useMemo(() => {
    if (!allModelsQ.data?.content) return [];
    return allModelsQ.data.content.map((m) => ({
      value: m.modelId,
      label: m.displayName || m.modelId,
    }));
  }, [allModelsQ.data]);

  const handleSubmit = useCallback(() => {
    const payload: CreateRateLimitPayload = { targetType };
    if (targetId.trim()) payload.targetId = targetId.trim();
    const rpm = Number(rpmLimit);
    if (rpm > 0) payload.rpmLimit = Math.floor(rpm);
    const tpm = Number(tpmLimit);
    if (tpm > 0) payload.tpmLimit = Math.floor(tpm);
    onSubmit(payload);
  }, [targetType, targetId, rpmLimit, tpmLimit, onSubmit]);

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (!v) {
        setTargetType('MODEL');
        setTargetId('');
        setRpmLimit('');
        setTpmLimit('');
      }
      onOpenChange(v);
    },
    [onOpenChange],
  );

  const handleTargetTypeChange = useCallback((v: string) => {
    setTargetType(v as RateLimitTargetType);
    setTargetId('');
  }, []);

  const valid = rpmLimit || tpmLimit;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Rate Limit Rule</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Target Type</Label>
            <Select value={targetType} onValueChange={handleTargetTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RATE_LIMIT_TARGET_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {targetType === 'MODEL' ? (
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {allModelsQ.isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : modelOptions.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No models available
                    </div>
                  ) : (
                    modelOptions.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Tenant ID</Label>
              <Input
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="e.g. 1001"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>RPM Limit</Label>
              <Input
                type="number"
                min={0}
                value={rpmLimit}
                onChange={(e) => setRpmLimit(e.target.value)}
                placeholder="Requests/min"
              />
            </div>
            <div className="space-y-2">
              <Label>TPM Limit</Label>
              <Input
                type="number"
                min={0}
                value={tpmLimit}
                onChange={(e) => setTpmLimit(e.target.value)}
                placeholder="Tokens/min"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">At least one of RPM or TPM must be set.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !valid}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
