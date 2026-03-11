import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useModelManagerStore } from '@/stores/modelManagerStore';
import { useAllModels } from '../hooks/useModels';
import { useAddPoolMember } from '../hooks/usePoolMembers';

export default function AddMemberDialog() {
  const { addMemberDialog, closeAddMember } = useModelManagerStore();
  const { open, poolId } = addMemberDialog;

  const { data: allModelsData } = useAllModels();
  const addMut = useAddPoolMember();

  const [selectedModelId, setSelectedModelId] = useState('');
  const [priority, setPriority] = useState('0');
  const [weight, setWeight] = useState('1');

  const allModels = allModelsData?.content ?? [];

  const handleSubmit = () => {
    if (!poolId || !selectedModelId) return;
    addMut.mutate(
      { poolId, payload: { modelId: selectedModelId, priority: parseInt(priority) || 0, weight: parseInt(weight) || 1 } },
      { onSuccess: () => { setSelectedModelId(''); setPriority('0'); setWeight('1'); closeAddMember(); } },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) closeAddMember(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Pool Member</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Model <span className="text-destructive">*</span></Label>
            <Select value={selectedModelId} onValueChange={setSelectedModelId}>
              <SelectTrigger><SelectValue placeholder="Select a model..." /></SelectTrigger>
              <SelectContent>
                {allModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.displayName || m.modelId} <span className="text-muted-foreground ml-1">({m.modelType})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Weight</Label>
              <Input type="number" min={1} value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={closeAddMember}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={addMut.isPending || !selectedModelId}>
            {addMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Add Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
