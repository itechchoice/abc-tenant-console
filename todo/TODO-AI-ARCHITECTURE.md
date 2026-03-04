# 🚀 大型 AI Agent & Workflow 架构落地 TODO List

本列表基于已确定的技术底座（纯 JSX + Zustand + React Flow + Zod + FetchEventSource）制定，是系统架构的实施蓝图。

## 核心基建阶段 (Core Infrastructure)

### 阶段一：底层状态与通信引擎 (State & Networking)
- [ ] **创建全局 Agent 状态树**：在 `src/stores/chatStore.js` 中使用 `zustand` 初始化状态（`messages`, `isTyping`, `currentWorkflowId`, `activeNodeId` 等）。
- [ ] **实现定制化 SSE 客户端**：基于 `@microsoft/fetch-event-source` 实现 `sendMessage` 方法，支持 POST 请求与 Body 传递。
- [ ] **打通事件路由分发层 (Event Router)**：在 SSE 的 `onmessage` 回调中，编写完整的 `switch-case` 路由，精准拦截后端的 15 种自定义事件（如 `message_chunk`, `tool_call`, `workflow_pending`, `client_interaction` 等）。
- [ ] **实现历史会话同步**：引入 `@tanstack/react-query`，编写加载历史会话列表和单次会话详情的查询 Hook，并与 Zustand Store 结合。

### 阶段二：数据安全防线 (Runtime Validation)
- [ ] **建立 Zod Schema 注册表**：在 `src/utils/schemas/` 目录下，为大模型常用的输出数据结构定义 Zod Schema（特别是 Tool Call 的 `args` 结构）。
- [ ] **实现交互表单校验防线**：为后端的 `client_interaction` 事件中的 `widgets` 数组定义强校验 Schema。
- [ ] **封装安全解析器**：编写一个工具函数 `safeParseAIJson`，内部使用 try-catch 和 zod，确保解析失败时抛出友好错误而非白屏，并在必要时触发大模型重试。

## 视图呈现阶段 (Generative UI & Visuals)

### 阶段三：富文本与生成式 UI (Chat Interface)
- [ ] **重构消息列表分发器**：改造 `src/components/ChatMain.jsx`，引入类型调度逻辑，根据 `msg.type` 分别渲染文本、工具卡片或交互表单。
- [ ] **封装 Markdown 渲染引擎**：创建 `src/components/GenerativeUI/MarkdownMessage.jsx`，集成 `react-markdown`、`remark-gfm` 和 `react-syntax-highlighter`，实现表格和代码块的完美渲染。
- [ ] **实现工具调用流转卡片 (Tool Call Card)**：创建 `ToolCallCard.jsx`，根据不同的 `toolName` 渲染对应的状态（执行中 loading、成功摘要、失败报错）。
- [ ] **实现动态交互表单 (Interaction Form)**：创建 `InteractionForm.jsx`，动态渲染按钮组（ButtonGroup）、输入框（Input）等控件，并打通向后端 `toolResults` 回传的链路以恢复中断的对话。

### 阶段四：复杂节点工作流 (Workflow Engine)
- [ ] **初始化 React Flow 画布**：在项目中开辟独立的工作流预览/编辑区域，引入 `@xyflow/react` 的 `<ReactFlow />` 核心组件。
- [ ] **设计 AI 专属自定义节点**：基于你们的业务场景，使用 React Flow 的 `custom nodes` API 开发特殊的 LLM 节点、工具节点。
- [ ] **打通画布与 Agent 状态流**：监听 Zustand Store 中的 `activeNodeId`。当接收到后端的 `node_pending` 或 `node_complete` 事件时，在 React Flow 画布中实时高亮正在执行的节点及连线动画。