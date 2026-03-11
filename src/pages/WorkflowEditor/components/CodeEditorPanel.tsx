import { useCallback, useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Check, WrapText, Locate } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkflowEditorLocalStore } from '@/stores/workflowEditorStore';
import { getReadOnlyDslPaths } from '../config/fieldConfig';
import { restoreReadOnlyFields } from '../utils/readOnlyRules';
import useCursorNodeFollow from '../hooks/useCursorNodeFollow';
import MonacoJsonEditor from './MonacoJsonEditor';
import type { editor } from 'monaco-editor';
import type { CanvasAreaHandle } from '@itechchoice/mcp-fe-shared/workflow-editor';

interface CodeEditorPanelProps {
  dslJson: string;
  initialDsl?: Record<string, unknown>;
  onApply: (json: string) => void;
  canvasRef?: React.RefObject<CanvasAreaHandle | null>;
}

const MIN_WIDTH = 360;
const MAX_WIDTH = 800;
const DEFAULT_WIDTH = 460;

const readOnlyKeys = getReadOnlyDslPaths();

export default function CodeEditorPanel({ dslJson, initialDsl, onApply, canvasRef }: CodeEditorPanelProps) {
  const { codeEditorOpen, setCodeEditorOpen } = useWorkflowEditorLocalStore();
  const [value, setValue] = useState(dslJson);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(DEFAULT_WIDTH);

  const dummyCanvasRef = useRef<CanvasAreaHandle | null>(null);
  const effectiveCanvasRef = canvasRef ?? dummyCanvasRef;
  const { followCursor, setFollowCursor, handleEditorMount, cleanup } = useCursorNodeFollow(effectiveCanvasRef);

  useEffect(() => {
    return () => { cleanup(); };
  }, [cleanup]);

  useEffect(() => {
    setValue(dslJson);
  }, [dslJson]);

  const handleFormat = useCallback(() => {
    editorRef.current?.getAction('editor.action.formatDocument')?.run();
  }, []);

  const handleApply = useCallback(() => {
    try {
      const parsed = JSON.parse(value);

      if (initialDsl && readOnlyKeys.length) {
        const restored = restoreReadOnlyFields(parsed, initialDsl as never, readOnlyKeys);
        if (restored.length > 0) {
          const formatted = JSON.stringify(parsed, null, 2);
          setValue(formatted);
          toast.warning(`Read-only fields restored: ${restored.map((k) => k.split('.').pop()).join(', ')}`);
          return;
        }
      }

      onApply(JSON.stringify(parsed, null, 2));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }, [value, onApply, initialDsl]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleResizeMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const delta = startXRef.current - moveEvent.clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));
      setPanelWidth(newWidth);
    };

    const handleResizeEnd = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  }, [panelWidth]);

  if (!codeEditorOpen) return null;

  return (
    <div className="relative flex flex-col shrink-0 border-l bg-background" style={{ width: panelWidth }}>
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-primary/20 active:bg-primary/30 transition-colors"
        onMouseDown={handleResizeStart}
      />

      <div className="flex items-center justify-between h-10 px-3 border-b">
        <span className="text-sm font-medium">DSL Editor</span>
        <div className="flex items-center gap-1">
          <Button
            variant={followCursor ? 'default' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setFollowCursor(!followCursor)}
            title={followCursor ? 'Disable Follow' : 'Follow Cursor'}
          >
            <Locate className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleFormat} title="Format">
            <WrapText className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleApply} title="Apply">
            <Check className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCodeEditorOpen(false)} title="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <MonacoJsonEditor
          value={value}
          onChange={setValue}
          readOnlyKeys={readOnlyKeys}
          onEditorMount={(ed) => {
            editorRef.current = ed;
            handleEditorMount(ed);
          }}
        />
      </div>
    </div>
  );
}
