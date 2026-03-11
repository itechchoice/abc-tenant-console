import type { ToolItem } from '@/schemas/workflowEditorSchema';

const delay = (ms = 300) => new Promise((r) => { setTimeout(r, ms); });

const TOOLS: ToolItem[] = [
  { id: 't1', name: 'web_search', description: 'Search the web', category: { id: 'c1', name: 'Search' }, icon: '🔍' },
  { id: 't2', name: 'execute_query', description: 'Run SQL query', category: { id: 'c2', name: 'Database' }, icon: '🐘' },
  { id: 't3', name: 'send_message', description: 'Send a message', category: { id: 'c3', name: 'Communication' }, icon: '💬' },
  { id: 't4', name: 'upload_file', description: 'Upload file to storage', category: { id: 'c4', name: 'Storage' }, icon: '📦' },
  { id: 't5', name: 'generate_text', description: 'Generate text with AI', category: { id: 'c5', name: 'AI' }, icon: '🤖' },
  { id: 't6', name: 'classify_ticket', description: 'Classify support ticket', category: { id: 'c3', name: 'Communication' }, icon: '🏷️' },
  { id: 't7', name: 'transform_data', description: 'Transform data format', category: { id: 'c2', name: 'Database' }, icon: '🔄' },
  { id: 't8', name: 'send_email', description: 'Send an email', category: { id: 'c3', name: 'Communication' }, icon: '📧' },
  { id: 't9', name: 'create_task', description: 'Create a task', category: { id: 'c6', name: 'Productivity' }, icon: '✅' },
  { id: 't10', name: 'fetch_metrics', description: 'Fetch analytics metrics', category: { id: 'c7', name: 'Analytics' }, icon: '📊' },
];

export async function fetchToolsList(): Promise<ToolItem[]> {
  await delay(200);
  return [...TOOLS];
}
