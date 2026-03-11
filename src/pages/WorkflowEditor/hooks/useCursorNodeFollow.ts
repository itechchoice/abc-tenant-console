import { useRef, useState, useCallback, useEffect } from 'react';
import type { editor } from 'monaco-editor';
import type { CanvasAreaHandle } from '@itechchoice/mcp-fe-shared/workflow-editor';
import { findNodeIdAtCursor } from '../utils/cursorNodeDetector';

const CURSOR_DEBOUNCE_MS = 300;

/**
 * Subscribes to Monaco cursor position changes, detects the DSL node
 * under the cursor, and highlights + fits to that node on the canvas.
 */
export default function useCursorNodeFollow(
  canvasRef: React.RefObject<CanvasAreaHandle | null>,
  defaultFollow = false,
) {
  const [followCursor, setFollowCursor] = useState(defaultFollow);
  const followCursorRef = useRef(false);
  const cursorDisposableRef = useRef<{ dispose: () => void } | null>(null);
  const cursorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHighlightedNodeIdRef = useRef<string | null>(null);

  const clearNodeHighlight = useCallback(() => {
    if (lastHighlightedNodeIdRef.current === null) return;
    lastHighlightedNodeIdRef.current = null;
    const rfInstance = canvasRef.current?.reactFlowInstance;
    rfInstance?.setNodes((nds) =>
      nds.map((n) =>
        n.data?._cursorHighlighted
          ? { ...n, data: { ...n.data, _cursorHighlighted: false } }
          : n,
      ),
    );
  }, [canvasRef]);

  useEffect(() => {
    followCursorRef.current = followCursor;
    if (!followCursor) clearNodeHighlight();
  }, [followCursor, clearNodeHighlight]);

  const highlightNodeOnCanvas = useCallback(
    (nodeId: string | null) => {
      if (!nodeId) {
        clearNodeHighlight();
        return;
      }
      if (nodeId === lastHighlightedNodeIdRef.current) return;
      lastHighlightedNodeIdRef.current = nodeId;

      const rfInstance = canvasRef.current?.reactFlowInstance;
      rfInstance?.setNodes((nds) =>
        nds.map((n) => {
          const shouldHighlight = n.id === nodeId;
          if (n.data?._cursorHighlighted === shouldHighlight) return n;
          return { ...n, data: { ...n.data, _cursorHighlighted: shouldHighlight } };
        }),
      );
      canvasRef.current?.fitView?.({ nodes: [{ id: nodeId }], padding: 0.3, duration: 300 });
    },
    [canvasRef, clearNodeHighlight],
  );

  const handleEditorMount = useCallback(
    (monacoEditor: editor.IStandaloneCodeEditor) => {
      cursorDisposableRef.current?.dispose();
      const handler = (e: editor.ICursorPositionChangedEvent) => {
        if (!followCursorRef.current) return;
        if (cursorDebounceRef.current) clearTimeout(cursorDebounceRef.current);
        cursorDebounceRef.current = setTimeout(() => {
          if (!followCursorRef.current) return;
          const model = monacoEditor.getModel();
          if (!model) return;
          const nodeId = findNodeIdAtCursor(model, e.position.lineNumber);
          highlightNodeOnCanvas(nodeId);
        }, CURSOR_DEBOUNCE_MS);
      };
      cursorDisposableRef.current = monacoEditor.onDidChangeCursorPosition(handler);
    },
    [highlightNodeOnCanvas],
  );

  const cleanup = useCallback(() => {
    cursorDisposableRef.current?.dispose();
    cursorDisposableRef.current = null;
    if (cursorDebounceRef.current) {
      clearTimeout(cursorDebounceRef.current);
      cursorDebounceRef.current = null;
    }
    clearNodeHighlight();
    setFollowCursor(false);
  }, [clearNodeHighlight]);

  useEffect(() => {
    return () => {
      cursorDisposableRef.current?.dispose();
      if (cursorDebounceRef.current) clearTimeout(cursorDebounceRef.current);
    };
  }, []);

  return { followCursor, setFollowCursor, handleEditorMount, cleanup };
}
