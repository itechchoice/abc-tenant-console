import { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useChatStore } from '@/stores/chatStore';
import { AgentNode } from '@/components/Workflow/nodes/AgentNode';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Props typedef
// ---------------------------------------------------------------------------

/**
 * @typedef {object} WorkflowCanvasProps
 * @property {import('@xyflow/react').Node[]} [initialNodes]
 *   Pre-built node array.  Falls back to built-in demo data when omitted.
 * @property {import('@xyflow/react').Edge[]} [initialEdges]
 *   Pre-built edge array.  Falls back to built-in demo data when omitted.
 * @property {string} [className]
 */

// ---------------------------------------------------------------------------
// Custom node type registry (MUST live outside the component to prevent
// React Flow from re-mounting every node on each render cycle).
// ---------------------------------------------------------------------------

const NODE_TYPES = { agent: AgentNode };

// ---------------------------------------------------------------------------
// Edge style presets
// ---------------------------------------------------------------------------

const ACTIVE_EDGE_STYLE = {
  stroke: '#3b82f6',
  strokeWidth: 2,
};

const IDLE_EDGE_STYLE = {
  stroke: undefined,
  strokeWidth: undefined,
};

// ---------------------------------------------------------------------------
// Default demo data (exercises the custom AgentNode)
// ---------------------------------------------------------------------------

/** @type {import('@xyflow/react').Node[]} */
const DEFAULT_NODES = [
  {
    id: 'node-input',
    type: 'agent',
    position: { x: 80, y: 40 },
    data: { label: 'User Request', type: 'condition', status: 'idle' },
  },
  {
    id: 'node-llm',
    type: 'agent',
    position: { x: 80, y: 180 },
    data: { label: 'LLM Reasoning', type: 'llm', status: 'idle' },
  },
  {
    id: 'node-tool',
    type: 'agent',
    position: { x: 80, y: 320 },
    data: { label: 'Web Search', type: 'tool', status: 'idle' },
  },
];

/** @type {import('@xyflow/react').Edge[]} */
const DEFAULT_EDGES = [
  { id: 'e-input-llm', source: 'node-input', target: 'node-llm' },
  { id: 'e-llm-tool', source: 'node-llm', target: 'node-tool' },
];

// ---------------------------------------------------------------------------
// WorkflowCanvas
// ---------------------------------------------------------------------------

/**
 * State-driven React Flow canvas that synchronises with the global
 * `chatStore.activeNodeId`.
 *
 * When the backend emits `node_pending` / `node_complete` events and the
 * SSE router updates `activeNodeId` in the store, this canvas
 * reactively highlights the executing node and animates the inbound edge.
 *
 * @param {WorkflowCanvasProps} props
 */
export function WorkflowCanvas({
  initialNodes,
  initialEdges,
  className,
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialNodes ?? DEFAULT_NODES,
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialEdges ?? DEFAULT_EDGES,
  );

  const activeNodeId = useChatStore((s) => s.activeNodeId);
  const prevActiveRef = useRef(null);

  // ── Reactive node highlighting ──────────────────────────────────
  useEffect(() => {
    const prevId = prevActiveRef.current;

    setNodes((nds) => nds.map((node) => {
      if (node.id === activeNodeId) {
        return {
          ...node,
          data: { ...node.data, status: 'running' },
        };
      }

      if (node.id === prevId && prevId !== activeNodeId) {
        return {
          ...node,
          data: { ...node.data, status: 'success' },
        };
      }

      return node;
    }));

    prevActiveRef.current = activeNodeId;
  }, [activeNodeId, setNodes]);

  // ── Reactive edge animation ─────────────────────────────────────
  useEffect(() => {
    setEdges((eds) => eds.map((edge) => {
      if (edge.target === activeNodeId) {
        return { ...edge, animated: true, style: ACTIVE_EDGE_STYLE };
      }
      return edge.animated || edge.style
        ? { ...edge, animated: false, style: IDLE_EDGE_STYLE }
        : edge;
    }));
  }, [activeNodeId, setEdges]);

  // ── Manual connect handler ──────────────────────────────────────
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div
      className={cn(
        'h-full w-full overflow-hidden rounded-lg border border-border',
        className,
      )}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ maxZoom: 1, padding: 0.4 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#ccc" gap={16} variant="dots" />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="rounded-md! border! border-border! shadow-sm!"
        />
      </ReactFlow>
    </div>
  );
}
