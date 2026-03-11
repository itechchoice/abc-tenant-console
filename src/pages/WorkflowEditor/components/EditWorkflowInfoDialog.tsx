import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useWorkflowEditorLocalStore } from '@/stores/workflowEditorStore';
import { useGroupList, useWorkflowGroupsBelonging } from '../../WorkflowList/hooks/useWorkflowGroups';
import { addWorkflowToGroup, removeWorkflowFromGroup } from '@/http/workflowApi';
import { workflowQueryKeys } from '../../WorkflowList/hooks/useWorkflowList';
import type { Workflow } from '@/schemas/workflowEditorSchema';

interface EditWorkflowInfoDialogProps {
  workflow: Workflow | undefined;
  onSave: (name: string, description: string) => void;
}

export default function EditWorkflowInfoDialog({ workflow, onSave }: EditWorkflowInfoDialogProps) {
  const { editInfoDialogOpen, closeEditInfoDialog } = useWorkflowEditorLocalStore();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: groupsData } = useGroupList();
  const { data: belongingGroups } = useWorkflowGroupsBelonging(workflow?.id);

  const groups = groupsData?.items ?? [];

  useEffect(() => {
    if (editInfoDialogOpen && workflow) {
      setName(workflow.name);
      setDescription(workflow.description ?? '');
      setSelectedGroupId(belongingGroups?.[0]?.id ?? '');
    }
  }, [editInfoDialogOpen, workflow, belongingGroups]);

  const handleSave = useCallback(async () => {
    if (!workflow) return;
    setSaving(true);

    try {
      const infoChanged = name !== workflow.name || description !== (workflow.description ?? '');
      const currentGroupId = belongingGroups?.[0]?.id ?? '';
      const groupChanged = currentGroupId !== selectedGroupId;

      if (infoChanged) {
        onSave(name, description);
      }

      if (groupChanged) {
        if (currentGroupId) {
          await removeWorkflowFromGroup(currentGroupId, workflow.id);
        }
        if (selectedGroupId) {
          await addWorkflowToGroup(selectedGroupId, workflow.id);
        }
        qc.invalidateQueries({ queryKey: workflowQueryKeys.lists() });
        qc.invalidateQueries({ queryKey: workflowQueryKeys.groups() });
      }

      if (!infoChanged && groupChanged) {
        toast.success('Workflow group updated');
      }

      closeEditInfoDialog();
    } catch (err) {
      toast.error(`Update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  }, [workflow, name, description, selectedGroupId, belongingGroups, onSave, closeEditInfoDialog, qc]);

  return (
    <Dialog open={editInfoDialogOpen} onOpenChange={(open) => { if (!open) closeEditInfoDialog(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Workflow Info</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1" />
          </div>
          {groups.length > 0 && (
            <div>
              <Label>Group</Label>
              <Select
                value={selectedGroupId || '__none__'}
                onValueChange={(v) => setSelectedGroupId(v === '__none__' ? '' : v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="No group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No group</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeEditInfoDialog}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
