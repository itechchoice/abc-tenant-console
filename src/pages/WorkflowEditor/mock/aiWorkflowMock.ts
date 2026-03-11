import type { GenerationStep } from '@/stores/aiViewStore';

interface SSECallbacks {
  onSteps?: (steps: GenerationStep[]) => void;
  onStepUpdate?: (stepId: string, status: GenerationStep['status']) => void;
  onChunk?: (content: string) => void;
  onResult?: (workflow: Record<string, unknown>) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

const MOCK_STEPS: GenerationStep[] = [
  { id: 'analyze', description: 'Analyzing requirements...', status: 'pending' },
  { id: 'design', description: 'Designing workflow structure...', status: 'pending' },
  { id: 'generate', description: 'Generating nodes and connections...', status: 'pending' },
  { id: 'optimize', description: 'Optimizing workflow...', status: 'pending' },
];

function generateMockWorkflow(prompt: string): Record<string, unknown> {
  const toolCount = 2 + Math.floor(Math.random() * 3);
  const nodes: Record<string, unknown>[] = [];
  const edges: Record<string, unknown>[] = [];

  const yStep = 120;
  const xCenter = 300;

  for (let i = 0; i < toolCount; i++) {
    const nodeId = `ai-node-${i + 1}`;
    nodes.push({
      id: nodeId,
      type: 'TOOL',
      position: { x: xCenter, y: 80 + i * yStep },
      config: {
        name: `Step ${i + 1}: ${prompt.slice(0, 20)}`,
        description: `AI-generated step ${i + 1} for "${prompt.slice(0, 40)}"`,
        toolId: `mock-tool-${i + 1}`,
        toolName: `ai-tool-${i + 1}`,
      },
    });

    if (i > 0) {
      edges.push({
        id: `ai-edge-${i}`,
        source: `ai-node-${i}`,
        target: nodeId,
      });
    }
  }

  return { nodes, edges };
}

/**
 * Mock SSE-style workflow generation.
 * Simulates the AI generation flow with delayed step updates.
 */
export async function generateWorkflowStream(
  prompt: string,
  callbacks: SSECallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const steps = [...MOCK_STEPS];

  const delay = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });

  try {
    callbacks.onSteps?.(steps);
    await delay(400);

    for (let i = 0; i < steps.length; i++) {
      if (signal?.aborted) return;

      callbacks.onStepUpdate?.(steps[i].id, 'in_progress');
      callbacks.onChunk?.(`Working on: ${steps[i].description}\n`);
      await delay(600 + Math.random() * 600);

      if (signal?.aborted) return;

      callbacks.onStepUpdate?.(steps[i].id, 'completed');
    }

    await delay(300);
    const workflow = generateMockWorkflow(prompt);
    callbacks.onResult?.(workflow);
    callbacks.onComplete?.();
  } catch (e) {
    if ((e as Error).name !== 'AbortError') {
      callbacks.onError?.((e as Error).message ?? 'Generation failed');
    }
  }
}
