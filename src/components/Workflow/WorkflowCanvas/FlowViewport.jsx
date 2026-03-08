import {
  Background,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useWorkflowRuntimeStore } from '@/stores/workflowRuntimeStore';
import { AgentNode } from '@/components/Workflow/nodes/AgentNode';
import { FIT_VIEW_OPTS } from './config';

const NODE_TYPES = { agent: AgentNode };

export function FlowViewport({ graph, fitViewTrigger }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.graphNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.graphEdges);
  const followLive = useWorkflowRuntimeStore((s) => s.followLive);
  const setFollowLive = useWorkflowRuntimeStore((s) => s.setFollowLive);
  const selectStep = useWorkflowRuntimeStore((s) => s.selectStep);
  const steps = useWorkflowRuntimeStore((s) => s.steps);

  const { fitView } = useReactFlow();
  const programmaticMoveRef = useRef(false);

  const fitWholeGraph = useCallback(() => {
    programmaticMoveRef.current = true;
    fitView(FIT_VIEW_OPTS);

    window.setTimeout(() => {
      programmaticMoveRef.current = false;
    }, 320);
  }, [fitView]);

  useEffect(() => {
    setNodes(graph.graphNodes);
    setEdges(graph.graphEdges);
  }, [graph.graphEdges, graph.graphNodes, setEdges, setNodes]);

  useEffect(() => {
    if (fitViewTrigger === 0) return;
    fitWholeGraph();
  }, [fitViewTrigger, fitWholeGraph]);

  useEffect(() => {
    if (!followLive) return;
    fitWholeGraph();
  }, [fitWholeGraph, followLive, graph.graphNodes, graph.graphEdges]);

  const handleNodeClick = useCallback((_, node) => {
    const latestStep = [...steps].reverse().find((step) => step.nodeKey === node.id);
    if (latestStep) selectStep(latestStep.id);
  }, [selectStep, steps]);

  const handleMoveStart = useCallback((_, event) => {
    if (programmaticMoveRef.current || !event) return;
    setFollowLive(false);
  }, [setFollowLive]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onMoveStart={handleMoveStart}
        fitView
        fitViewOptions={FIT_VIEW_OPTS}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant="dots"
          gap={18}
          size={1}
          color="rgba(15,23,42,0.10)"
        />
      </ReactFlow>
    </div>
  );
}
