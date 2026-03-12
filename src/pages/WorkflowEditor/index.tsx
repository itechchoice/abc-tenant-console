import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Node } from '@xyflow/react';
import { CanvasArea, ToolsSidebar, FilterPanel, convertToReactFlow, convertToDsl, type CanvasAreaHandle } from '@itechchoice/mcp-fe-shared/workflow-editor';
import { NodePropertyDrawer } from '@itechchoice/mcp-fe-shared';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkflowEditorLocalStore } from '@/stores/workflowEditorStore';
import { useAiViewStore } from '@/stores/aiViewStore';
import { useWorkflowEditor } from './hooks/useWorkflowEditor';
import { useToolsList } from './hooks/useToolsList';
import { useChatModels } from '@/hooks/useModels';
import EditorTopBar from './components/EditorTopBar';
import EditWorkflowInfoDialog from './components/EditWorkflowInfoDialog';
import CodeEditorPanel from './components/CodeEditorPanel';
import GlobalCodeEditor from './components/GlobalCodeEditor';
import MonacoJsonEditor from './components/MonacoJsonEditor';
import RunDrawer from './components/RunDrawer';
import AiChatSidebar, { type AiChatSidebarRef } from './components/AiChatSidebar';
import AiViewOverlay from './components/AiViewOverlay';
import { NODE_FIELDS, NODE_PROPERTY_GROUPS, getReadOnlyDslPaths } from './config/fieldConfig';
import type { DslGraph, ApiEdge } from '@/schemas/workflowEditorSchema';

export default function WorkflowEditor() {
  return <WorkflowEditorInner />;
}

function WorkflowEditorInner() {
  const {
    workflow, isLoading, id: workflowId,
    canvasRef, saveMutation, handleSave, handlePublish, handleExport, handleInfoSave,
  } = useWorkflowEditor();

  const { openRunDrawer, setDirty, codeEditorOpen, toggleCodeEditor } = useWorkflowEditorLocalStore();
  const { activeView, aiWorkflow, currentSnapshot, apply: aiApply, discard: aiDiscard, reset: aiReset } = useAiViewStore();
  const { data: tools, isLoading: toolsLoading } = useToolsList();
  const { data: models = [] } = useChatModels();

  const [dslJson, setDslJson] = useState('');
  const [selectedNode, setSelectedNode] = useState<Record<string, unknown> | null>(null);
  const internalCanvasRef = useRef<CanvasAreaHandle>(null);
  const aiChatRef = useRef<AiChatSidebarRef>(null);
  const readOnlyCodeKeys = useMemo(() => getReadOnlyDslPaths(), []);

  const nodeFields = useMemo(() => NODE_FIELDS.map((f) => {
    if (f.key === 'data.modelId') {
      return { ...f, options: models.map((m) => ({ label: m.displayName || m.modelId, value: m.modelId })) };
    }
    return f;
  }), [models]);

  // AI Chat state
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiSelectedNodes, setAiSelectedNodes] = useState<Node[]>([]);

  // FilterPanel state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // Expose the ref upward so useWorkflowEditor can use it
  useEffect(() => {
    if (internalCanvasRef.current) {
      (canvasRef as React.MutableRefObject<CanvasAreaHandle | null>).current = internalCanvasRef.current;
    }
  });

  // Ensure every node has a valid position and hydrate edge ids
  const normalizeDefinition = useCallback((def: DslGraph): DslGraph & { edges: Array<ApiEdge & { id: string }> } => {
    return {
      ...def,
      nodes: (def.nodes ?? []).map((n, i) => ({
        ...n,
        position: n.position ?? { x: 100 + i * 200, y: 100 },
      })),
      edges: (def.edges ?? []).map((e, i) => ({
        ...e,
        id: `e-${e.source}-${e.target}-${i}`,
      })),
    };
  }, []);

  // Load workflow definition into canvas once data arrives
  useEffect(() => {
    if (workflow?.definition && internalCanvasRef.current) {
      try {
        const normalized = normalizeDefinition(workflow.definition);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const flowData = convertToReactFlow(normalized as any);
        internalCanvasRef.current.loadWorkflow(flowData);
      } catch {
        const fallback = normalizeDefinition(workflow.definition);
        internalCanvasRef.current.loadWorkflow(fallback as never);
      }
    }
  }, [workflow?.definition, normalizeDefinition]);

  // Sync DSL JSON for code editor
  useEffect(() => {
    if (workflow?.definition) {
      setDslJson(JSON.stringify(workflow.definition, null, 2));
    }
  }, [workflow?.definition]);

  // ────── AI Chat open/close (entry temporarily hidden, keep logic for later) ──────
  // const handleOpenAiChat = useCallback(() => {
  //   if (!aiChatOpen) {
  //     if (selectedCategory) setSelectedCategory(null);
  //     setAiChatOpen(true);
  //   } else {
  //     setAiChatOpen(false);
  //     setAiSelectedNodes([]);
  //   }
  // }, [aiChatOpen, selectedCategory]);

  const handleCloseAiChat = useCallback(() => {
    setAiChatOpen(false);
    setAiSelectedNodes([]);
  }, []);

  // ────── Node click: select node + add to AI tags ──────
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as unknown as Record<string, unknown>);
    if (aiChatOpen) {
      setAiSelectedNodes((prev) => {
        if (prev.length === 1 && prev[0].id === node.id) return prev;
        return [node];
      });
    }
  }, [aiChatOpen]);

  const handleRemoveAiNode = useCallback((nodeId: string) => {
    setAiSelectedNodes((prev) => prev.filter((n) => n.id !== nodeId));
  }, []);

  const handleNodePropertyClose = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleNodePropertySave = useCallback((updatedNode: Record<string, unknown>, _originalNode: Record<string, unknown>) => {
    if (!internalCanvasRef.current) return;
    const rfInstance = internalCanvasRef.current.reactFlowInstance;
    if (!rfInstance) return;
    rfInstance.setNodes((nodes: Node[]) =>
      nodes.map((n) => (n.id === (updatedNode as { id?: string }).id ? (updatedNode as Node) : n)),
    );
    setSelectedNode(updatedNode);
    setDirty(true);
  }, [setDirty]);

  const getGlobalCode = useCallback(() => {
    const data = internalCanvasRef.current?.getWorkflowData();
    if (!data) return '{}';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dsl = convertToDsl(data as any);
    return JSON.stringify(dsl, null, 2);
  }, []);

  // Cleanup AI state on unmount
  useEffect(() => {
    return () => aiReset();
  }, [aiReset]);

  // Swap canvas content when toggling between Current / AI View
  useEffect(() => {
    if (!internalCanvasRef.current) return;
    if (activeView === 'current' && currentSnapshot) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      internalCanvasRef.current.loadWorkflow(currentSnapshot as any);
    } else if (activeView === 'ai' && aiWorkflow) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const flowData = convertToReactFlow(aiWorkflow as any);
      internalCanvasRef.current.loadWorkflow(flowData);
    }
  }, [activeView, currentSnapshot, aiWorkflow]);

  const handleAiApply = useCallback(() => {
    aiApply();
    setDirty(true);
  }, [aiApply, setDirty]);

  const handleAiDiscard = useCallback(() => {
    const snapshot = aiDiscard();
    if (snapshot && internalCanvasRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      internalCanvasRef.current.loadWorkflow(snapshot as any);
    }
  }, [aiDiscard]);

  const handleAiRegenerate = useCallback(() => {
    const snapshot = useAiViewStore.getState().currentSnapshot;
    if (snapshot && internalCanvasRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      internalCanvasRef.current.loadWorkflow(snapshot as any);
    }
    aiChatRef.current?.regenerate();
  }, []);

  const renderCodeEditor = useCallback((options: {
    value: string;
    onChange: (value: string) => void;
    height?: string;
    readOnlyKeys?: string[];
    showToolbar?: boolean;
  }): React.ReactNode => {
    if (options.showToolbar) {
      return (
        <GlobalCodeEditor
          value={options.value}
          onChange={options.onChange}
          height={options.height}
          readOnlyKeys={options.readOnlyKeys}
          canvasRef={internalCanvasRef}
        />
      );
    }
    return (
      <MonacoJsonEditor
        value={options.value}
        onChange={options.onChange}
        height={options.height}
        readOnlyKeys={options.readOnlyKeys}
      />
    );
  }, []);

  const handleCodeApply = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as DslGraph;
      setDslJson(json);
      setDirty(true);
      if (internalCanvasRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const flowData = convertToReactFlow(parsed as any);
        internalCanvasRef.current.loadWorkflow(flowData);
      }
    } catch { /* ignore invalid */ }
  }, [setDirty]);

  const handleSaveGlobalCode = useCallback(async (json: string) => {
    handleCodeApply(json);
  }, [handleCodeApply]);

  // handleInfoSave is provided by useWorkflowEditor hook

  const handleNodesEdgesChange = useCallback(() => {
    if (!useWorkflowEditorLocalStore.getState().isDirty) {
      setDirty(true);
    }
  }, [setDirty]);

  // ────── FilterPanel search ──────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSearchTools = useCallback(async (keyword: string, category: any) => {
    const k = keyword.toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((category.tools || []) as any[]).filter(
      (t) =>
        (t.name?.toLowerCase() ?? '').includes(k) ||
        (t.toolId?.toLowerCase() ?? '').includes(k) ||
        (t.description?.toLowerCase() ?? '').includes(k),
    );
  }, []);

  const toolsList = useMemo(() => {
    if (!tools) return [];
    return tools.map((server) => ({
      id: server.id,
      name: server.name,
      icon: server.icon,
      count: server.tools?.length ?? server.toolCount ?? 0,
      tools: (server.tools ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        toolId: t.name,
        description: t.description,
        tool: `${server.serverCode}:${t.name}`,
      })),
    }));
  }, [tools]);

  // ────── BottomToolbar items (AI entry temporarily hidden) ──────
  const bottomToolbarItems = useMemo(() => [
    'logic',
    '|', 'undo', 'redo', '|',
    'zoom-in', 'zoom-out', 'fit-view', 'code',
    'tools',
  ] as const, []);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="h-12 border-b flex items-center px-4">
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="flex-1 m-4 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <EditorTopBar
        workflow={workflow}
        isSaving={saveMutation.isPending}
        onSave={handleSave}
        onPublish={handlePublish}
        onExport={handleExport}
        onRun={openRunDrawer}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left panel: AI Chat or ToolsSidebar (mutually exclusive) */}
        {aiChatOpen ? (
          <AiChatSidebar
            ref={aiChatRef}
            canvasRef={internalCanvasRef}
            onDirty={() => setDirty(true)}
            onClose={handleCloseAiChat}
            selectedNodes={aiSelectedNodes}
            onRemoveSelectedNode={handleRemoveAiNode}
          />
        ) : (
          <div className="w-60 shrink-0 border-r overflow-auto">
            <ToolsSidebar
              toolsList={toolsList}
              loading={toolsLoading}
              onFilterClick={setSelectedCategory}
            />
          </div>
        )}

        {/* FilterPanel (visible when a category is selected and AI chat is closed) */}
        {!aiChatOpen && selectedCategory && (
          <FilterPanel
            category={selectedCategory}
            onClose={() => setSelectedCategory(null)}
            onSearch={handleSearchTools}
          />
        )}

        {/* Canvas area */}
        <div className="flex-1 relative">
          <CanvasArea
            ref={internalCanvasRef}
            onNodesEdgesChange={handleNodesEdgesChange}
            onNodeClick={handleNodeClick}
            showBottomToolbar
            bottomToolbarItems={bottomToolbarItems}
            logicNodeTypes={['model']}
            enableFileDrop
            onOpenCodeEditor={toggleCodeEditor}
            codeEditorOpen={codeEditorOpen}
            fitView
            showMiniMap
          />
          <AiViewOverlay
            onApply={handleAiApply}
            onDiscard={handleAiDiscard}
            onRegenerate={handleAiRegenerate}
          />
          {selectedNode && (
            <NodePropertyDrawer
              node={selectedNode}
              fields={nodeFields}
              groups={NODE_PROPERTY_GROUPS}
              onClose={handleNodePropertyClose}
              onSave={handleNodePropertySave}
              title={String((selectedNode as Record<string, unknown>).type ?? 'Node')}
              subtitle={String(((selectedNode as Record<string, { name?: string }>).data)?.name ?? '')}
              readOnlyCodeKeys={readOnlyCodeKeys}
              getGlobalCode={getGlobalCode}
              onSaveGlobalCode={handleSaveGlobalCode}
              renderCodeEditor={renderCodeEditor}
            />
          )}
        </div>

        {/* Code editor panel (right side) */}
        {codeEditorOpen && (
          <CodeEditorPanel
            dslJson={dslJson}
            initialDsl={workflow?.definition as Record<string, unknown> | undefined}
            onApply={handleCodeApply}
            canvasRef={internalCanvasRef}
          />
        )}
      </div>

      {/* Dialogs */}
      <EditWorkflowInfoDialog workflow={workflow} onSave={handleInfoSave} />
      <RunDrawer workflowId={workflowId} canvasRef={internalCanvasRef} />
    </div>
  );
}
