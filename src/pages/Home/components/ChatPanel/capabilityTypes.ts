export type ToolSelection =
  | { type: 'all' }
  | { type: 'server'; serverName: string; serverCode: string; displayName: string }
  | { type: 'tool'; serverName: string; serverCode: string; toolName: string; displayName: string };

export interface SelectedWorkflow {
  id: string;
  name: string;
}

export function buildCapabilities(
  tools: ToolSelection[],
  workflow: SelectedWorkflow | null,
): string[] {
  const caps: string[] = [];

  if (tools.some((t) => t.type === 'all')) {
    caps.push('*');
  } else {
    for (const t of tools) {
      if (t.type === 'server') caps.push(`${t.serverCode}:*`);
      else if (t.type === 'tool') caps.push(`${t.serverCode}:${t.toolName}`);
    }
  }

  if (workflow) caps.push(`workflow:${workflow.id}`);
  return caps;
}

export function getToolSelectionLabel(sel: ToolSelection): string {
  if (sel.type === 'all') return 'All Tools';
  if (sel.type === 'server') return `${sel.displayName} (all)`;
  return sel.displayName;
}
