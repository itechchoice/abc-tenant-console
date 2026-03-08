import {
  AGENT_BLUEPRINT,
  AGENT_EDGES,
  MODEL_BLUEPRINT,
  MODEL_EDGES,
} from './config';

function getBlueprint(chatMode) {
  return chatMode === 'model'
    ? { nodes: MODEL_BLUEPRINT, edges: MODEL_EDGES }
    : { nodes: AGENT_BLUEPRINT, edges: AGENT_EDGES };
}

function getVisitedNodeIds(steps) {
  return [...new Set(steps.map((step) => step.nodeKey))];
}

function getNodeStatus({
  nodeId,
  steps,
  currentStep,
  phase,
  status,
}) {
  const nodeSteps = steps.filter((step) => step.nodeKey === nodeId);
  const latestStep = nodeSteps[nodeSteps.length - 1];

  if (latestStep?.status === 'failed') return 'error';
  if (currentStep?.nodeKey === nodeId && status === 'waiting') return 'paused';
  if (currentStep?.nodeKey === nodeId) return 'running';
  if (!nodeSteps.length) return 'idle';
  if (phase === 'review' && status === 'completed') return 'completed';
  return 'success';
}

export function buildGraphState({
  chatMode,
  steps,
  currentStep,
  selectedStep,
  phase,
  status,
}) {
  const { nodes, edges } = getBlueprint(chatMode);
  const visitedNodeIds = getVisitedNodeIds(steps);
  const selectedNodeId = selectedStep?.nodeKey || currentStep?.nodeKey || null;

  const graphNodes = nodes.map((node) => ({
    id: node.id,
    type: 'agent',
    position: node.position,
    data: {
      label: node.label,
      subtitle: node.subtitle,
      detail: node.detail,
      type: node.type,
      status: getNodeStatus({
        nodeId: node.id,
        steps,
        currentStep,
        phase,
        status,
      }),
      isSelected: selectedNodeId === node.id,
      isCurrent: currentStep?.nodeKey === node.id,
      activityCount: steps.filter((step) => step.nodeKey === node.id).length,
    },
  }));

  const graphEdges = edges.map((edge) => {
    const isTraversed = visitedNodeIds.includes(edge.source)
      && visitedNodeIds.includes(edge.target);
    const isActive = currentStep?.nodeKey === edge.target;
    const isFailed = status === 'failed' && currentStep?.nodeKey === edge.target;
    const stroke = isFailed
      ? '#dc2626'
      : isActive || isTraversed
        ? '#0f172a'
        : 'rgba(148, 163, 184, 0.28)';

    return {
      ...edge,
      animated: isActive,
      style: {
        stroke,
        strokeWidth: isActive ? 2.4 : isTraversed ? 1.8 : 1.2,
        opacity: isTraversed || isActive ? 1 : 0.6,
      },
    };
  });

  return {
    graphNodes,
    graphEdges,
  };
}
