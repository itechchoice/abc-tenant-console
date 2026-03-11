import type { editor } from 'monaco-editor';

const ID_PATTERN = /^\s{6}"id"\s*:\s*"([^"]+)"/;
const SECTION_PATTERN = /^\s{2}"(nodes|edges)"\s*:/;
const NODE_OBJ_INDENT = 4;

/**
 * Detect which DSL node the Monaco cursor is inside,
 * based on indentation scanning of formatted JSON.
 *
 * Assumptions (JSON.stringify(dsl, null, 2) output):
 *   indent 0 → root `{`
 *   indent 2 → "nodes": [ / "edges": [
 *   indent 4 → each node/edge object `{`
 *   indent 6 → node/edge properties "id": "..."
 */
export function findNodeIdAtCursor(
  model: editor.ITextModel,
  lineNumber: number,
): string | null {
  const totalLines = model.getLineCount();
  if (lineNumber < 1 || lineNumber > totalLines) return null;

  let objStartLine: number | null = null;
  for (let i = lineNumber; i >= 1; i--) {
    const text = model.getLineContent(i);
    const stripped = text.trimStart();
    const indent = text.length - stripped.length;

    if (indent === NODE_OBJ_INDENT && stripped.startsWith('{')) {
      objStartLine = i;
      break;
    }
    if (indent <= 2 && stripped.length > 0) return null;
  }
  if (objStartLine === null) return null;

  let nodeId: string | null = null;
  for (let i = objStartLine; i <= Math.min(objStartLine + 8, totalLines); i++) {
    const text = model.getLineContent(i);
    const match = text.match(ID_PATTERN);
    if (match) {
      nodeId = match[1];
      break;
    }
    const stripped = text.trimStart();
    const indent = text.length - stripped.length;
    if (indent === NODE_OBJ_INDENT && stripped.startsWith('}')) break;
  }
  if (!nodeId) return null;

  for (let i = objStartLine - 1; i >= 1; i--) {
    const text = model.getLineContent(i);
    const match = text.match(SECTION_PATTERN);
    if (match) {
      return match[1] === 'nodes' ? nodeId : null;
    }
  }

  return null;
}
