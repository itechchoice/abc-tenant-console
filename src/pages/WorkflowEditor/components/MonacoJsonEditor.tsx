import { useCallback, useRef, useEffect } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface MonacoJsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnlyKeys?: string[];
  readOnly?: boolean;
  onEditorMount?: (editor: editor.IStandaloneCodeEditor) => void;
}

function leafKey(path: string): string {
  const idx = path.lastIndexOf('.');
  return idx >= 0 ? path.slice(idx + 1) : path;
}

function getDecorationKeys(readOnlyKeys?: string[]): string[] {
  if (!readOnlyKeys?.length) return [];
  return [...new Set(readOnlyKeys.map(leafKey))];
}

export default function MonacoJsonEditor({
  value,
  onChange,
  height = '100%',
  readOnlyKeys,
  readOnly = false,
  onEditorMount,
}: MonacoJsonEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);

  const applyReadOnlyDecorations = useCallback((monacoEditor: editor.IStandaloneCodeEditor, keys?: string[]) => {
    const decoKeys = getDecorationKeys(keys);
    if (!decoKeys.length) {
      decorationsRef.current?.clear();
      return;
    }
    const model = monacoEditor.getModel();
    if (!model) return;

    const escaped = decoKeys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = `"(?:${escaped.join('|')})"\\s*:`;
    const matches = model.findMatches(pattern, true, true, false, null, false);
    const decos: editor.IModelDeltaDecoration[] = matches.map((match) => ({
      range: match.range,
      options: { isWholeLine: true, className: 'code-editor-readonly-line' },
    }));

    if (decorationsRef.current) {
      decorationsRef.current.set(decos);
    } else {
      decorationsRef.current = monacoEditor.createDecorationsCollection(decos);
    }
  }, []);

  const handleMount: OnMount = useCallback((monacoEditor) => {
    editorRef.current = monacoEditor;
    applyReadOnlyDecorations(monacoEditor, readOnlyKeys);
    onEditorMount?.(monacoEditor);
  }, [readOnlyKeys, applyReadOnlyDecorations, onEditorMount]);

  useEffect(() => {
    if (editorRef.current) {
      applyReadOnlyDecorations(editorRef.current, readOnlyKeys);
    }
  }, [readOnlyKeys, applyReadOnlyDecorations]);

  useEffect(() => {
    if (!editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;
    const disposable = model.onDidChangeContent(() => {
      if (editorRef.current) {
        applyReadOnlyDecorations(editorRef.current, readOnlyKeys);
      }
    });
    return () => disposable.dispose();
  }, [readOnlyKeys, applyReadOnlyDecorations]);

  return (
    <Editor
      height={height}
      defaultLanguage="json"
      value={value}
      onChange={(v) => onChange(v ?? '')}
      onMount={handleMount}
      options={{
        minimap: { enabled: false },
        fontSize: 12,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        automaticLayout: true,
        readOnly,
        formatOnPaste: true,
      }}
      theme="vs-dark"
    />
  );
}
