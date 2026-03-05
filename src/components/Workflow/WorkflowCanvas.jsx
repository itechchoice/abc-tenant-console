import { useCallback } from 'react';
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
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Props typedef
// ---------------------------------------------------------------------------

/**
 * @typedef {object} WorkflowCanvasProps
 * @property {import('@xyflow/react').Node[]} [initialNodes]
 *   Pre-built node array.  Falls back to built-in mock data when omitted.
 * @property {import('@xyflow/react').Edge[]} [initialEdges]
 *   Pre-built edge array.  Falls back to built-in mock data when omitted.
 * @property {string} [className]
 */

// ---------------------------------------------------------------------------
// Default mock data (used when no external nodes/edges are provided)
// ---------------------------------------------------------------------------

/** @type {import('@xyflow/react').Node[]} */
const DEFAULT_NODES = [
  {
    id: 'node-user-request',
    type: 'default',
    position: { x: 100, y: 120 },
    data: { label: 'User Request' },
  },
  {
    id: 'node-ai-agent',
    type: 'default',
    position: { x: 380, y: 120 },
    data: { label: 'AI Agent' },
  },
];

/** @type {import('@xyflow/react').Edge[]} */
const DEFAULT_EDGES = [
  {
    id: 'edge-user-to-agent',
    source: 'node-user-request',
    target: 'node-ai-agent',
    animated: true,
  },
];

// ---------------------------------------------------------------------------
// WorkflowCanvas
// ---------------------------------------------------------------------------

/**
 * Interactive React Flow canvas for visualising AI agent workflows.
 *
 * Renders a pannable / zoomable node graph with dot-grid background,
 * minimap, and zoom controls.  Accepts optional pre-built `initialNodes`
 * and `initialEdges`; when omitted, a minimal two-node mock graph is
 * rendered for development / testing purposes.
 *
 * @param {WorkflowCanvasProps} props
 */
export function WorkflowCanvas({
  initialNodes,
  initialEdges,
  className,
}) {
  const [nodes, , onNodesChange] = useNodesState(
    initialNodes ?? DEFAULT_NODES,
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialEdges ?? DEFAULT_EDGES,
  );

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
        fitView
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
