@api/获取租户统计.md @api/获取租户列表.md
请作为 Senior UI/UX Engineer 执行 API 到 UI 的页面生成。在编码过程中，请严格应用 frontend design (前端视觉规范)、design taste (高级设计品味与布局)、vercel composition patterns (Vercel 组件模式) 以及 react best practices (React 最佳实践)。请覆盖大模型默认的 UI 偏好，实现高品质的 Web 设计方案。
要求：
1. 帮我生成“租户总览分析看板”页面。
2. 页面上方展示统计卡片（对接统计接口），下方展示数据表格（对接列表接口）。
3. 两个接口必须并行请求，不要互相阻塞，且各自拥有独立的 Loading 骨架屏状态。

---

@project.mdc @architecture-pure-jsx-types.mdc @src/components/Workflow/WorkflowCanvas.jsx @src/stores/chatStore.js @src/components/Workflow/nodes/AgentNode.jsx
@.cursor/rules/project.mdc @.cursor/rules/architecture-pure-jsx-types.mdc @src/components/Workflow/WorkflowCanvas.jsx @src/stores/chatStore.js @src/components/Workflow/nodes/AgentNode.jsx 
请担任 Senior UI/UX Engineer 和 Senior React Architect，帮我完成阶段四的最后一步，也是整个系统的核心护城河：“打通画布与 Agent 状态流”。

**任务拆解：**
重构 `src/components/Workflow/WorkflowCanvas.jsx`，使其成为一个由状态机驱动的响应式画布。

**核心功能需求：**
1. **状态订阅**：
   - 引入 `useChatStore`，订阅全局的 `activeNodeId`（或通过遍历 `messages` 分析当前的工作流执行状态）。
2. **注册自定义节点**：
   - 将上一步写好的 `AgentNode` 导入，并在组件外定义 `nodeTypes = { customAgent: AgentNode }`。
   - 确保传给 `<ReactFlow>` 的 `nodeTypes` 属性正确映射。
3. **响应式节点高亮 (Reactive Nodes)**：
   - 使用 `useEffect` 监听 `activeNodeId` 的变化。
   - 当 `activeNodeId` 发生改变时，遍历当前的 `nodes` 数组（遵守不可变原则），找到 `id === activeNodeId` 的节点，将其 `data.status` 设置为 `'running'`。
   - 将之前处于 `'running'` 状态的节点更新为 `'success'`。
4. **动态连线特效 (Animated Edges)**：
   - 同步遍历 `edges` 数组。如果某条连线的 `target` 是当前的 `activeNodeId`，将其 `animated` 属性设为 `true`，并可以给它加上耀眼的强调色（如 `style: { stroke: '#3b82f6', strokeWidth: 2 }`）。

**⚠️ 架构红线约束：**
1. **纯 JSX + JSDoc**：严禁使用 TypeScript。
2. **性能优化**：不要将 `nodeTypes` 对象定义在组件内部，必须定义在组件外部以防止 React Flow 每帧重新渲染引发死循环告警。
3. **安全更新**：使用 React Flow 推荐的 `setNodes` 和 `setEdges` 函数进行状态更新，切勿直接修改原对象。