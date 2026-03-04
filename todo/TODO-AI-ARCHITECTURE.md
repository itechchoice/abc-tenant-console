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

## 组件库基建 (shadcn/ui 降维融合)

**🎯 核心目标：**
在坚守“纯 JSX 无 TS”和“English-Only UI”架构红线的前提下，引入目前最强大的 `shadcn/ui` 组件库。通过 AI 驱动的“组件翻译与重塑”工作流，打造兼具 Vercel 高级设计感、物理弹簧动效且自带完美 JSDoc 类型提示的原子组件。

**✅ Action Items (执行步骤)：**

- [x] **1. 无 TS 化的 shadcn 核心初始化**
  - 在终端运行 `npx shadcn@latest init`。
  - 交互式配置严格遵守：Style 选 `New York`，Base Color 选 `Zinc`，Use CSS variables 选 `yes`，**Use TypeScript 必须选 `no`**。

- [x] **2. 部署高级动效与图标引擎**
  - 运行 `pnpm add framer-motion lucide-react clsx tailwind-merge`。
  - 确保满足 `.agents/skills/design-taste-frontend` 中对“微交互”和“无 Emoji 高级图标”的硬性要求。

- [ ] **3. AI 驱动的组件生成测试 (以 Button 为例)**
  - **⚠️ 架构红线：** 绝对禁止使用 `npx shadcn add xxx` 命令生成自带 TS 的残缺组件。
  - 使用专属 Prompt 召唤 Cursor Agent：“前往 shadcn 官网读取 Button 实现，结合 `architecture-pure-jsx-types.mdc` 和 English-Only 规则，用纯 JSX 在 `src/components/ui/button.jsx` 中手搓出自带完美 JSDoc 类型声明的按钮”。
  - 验收生成的 Button 组件：确保没有 `any` 警告，Props 有清晰的代码提示，且完全符合高级设计品味。