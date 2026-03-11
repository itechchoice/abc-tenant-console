import { useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Locate, WrapText } from 'lucide-react';
import useCursorNodeFollow from '../hooks/useCursorNodeFollow';
import MonacoJsonEditor from './MonacoJsonEditor';
import type { editor } from 'monaco-editor';
import type { CanvasAreaHandle } from '@itechchoice/mcp-fe-shared/workflow-editor';

interface GlobalCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnlyKeys?: string[];
  canvasRef: React.RefObject<CanvasAreaHandle | null>;
}

export default function GlobalCodeEditor({
  value,
  onChange,
  height = '100%',
  readOnlyKeys,
  canvasRef,
}: GlobalCodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const dummyCanvasRef = useRef<CanvasAreaHandle | null>(null);
  const effectiveCanvasRef = canvasRef ?? dummyCanvasRef;
  const { followCursor, setFollowCursor, handleEditorMount, cleanup } = useCursorNodeFollow(effectiveCanvasRef);

  useEffect(() => {
    return () => { cleanup(); };
  }, [cleanup]);

  const handleFormat = useCallback(() => {
    editorRef.current?.getAction('editor.action.formatDocument')?.run();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-end gap-1 px-2 py-1 border-b shrink-0">
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
      </div>
      <div className="flex-1 min-h-0">
        <MonacoJsonEditor
          value={value}
          onChange={onChange}
          height={height}
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
