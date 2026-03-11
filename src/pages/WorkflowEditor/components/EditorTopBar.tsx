import { ArrowLeft, Save, Upload, Play, Download, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useWorkflowEditorLocalStore } from '@/stores/workflowEditorStore';
import type { Workflow } from '@/schemas/workflowEditorSchema';

interface EditorTopBarProps {
  workflow: Workflow | undefined;
  isSaving: boolean;
  onSave: () => void;
  onPublish: () => void;
  onExport: () => void;
  onRun: () => void;
}

export default function EditorTopBar({
  workflow, isSaving, onSave, onPublish, onExport, onRun,
}: EditorTopBarProps) {
  const navigate = useNavigate();
  const { isDirty, openEditInfoDialog } = useWorkflowEditorLocalStore();
  const isPublished = workflow?.status === 'published';

  return (
    <div className="flex h-12 items-center justify-between border-b bg-background px-3 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-2 min-w-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/workflows')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="font-medium truncate max-w-[240px]">
            {workflow?.name ?? 'New Workflow'}
          </h2>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={openEditInfoDialog}>
            <Pencil className="h-3 w-3" />
          </Button>
          {isDirty && (
            <Badge variant="outline" className="text-[10px] px-1.5 h-5">Unsaved</Badge>
          )}
          <Badge variant={isPublished ? 'default' : 'secondary'} className="text-[10px] capitalize">
            {workflow?.status ?? 'draft'}
          </Badge>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="sm" onClick={onExport}>
          <Download className={cn('h-4 w-4 mr-1')} />
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-1" />
          {isSaving ? 'Saving...' : 'Save Draft'}
        </Button>
        <Button variant="outline" size="sm" onClick={onPublish} disabled={isSaving}>
          <Upload className="h-4 w-4 mr-1" />
          Publish
        </Button>
        <Button size="sm" onClick={onRun}>
          <Play className="h-4 w-4 mr-1" />
          Run
        </Button>
      </div>
    </div>
  );
}
