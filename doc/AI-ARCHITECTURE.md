# 🚀 大型 AI Agent & Workflow 架构落地 Done List

本列表基于已确定的技术底座（纯 JSX + Zustand + React Flow + Zod + FetchEventSource）制定，是系统架构的实施蓝图。

## 第 0 阶段：系统级底层基建 (System Foundation) - ✅ 已完成

### 架构规则与 AI 上下文注入 (AI Context & Rules)
- [x] **定义全局工程规范**：配置 `.cursor/rules/project.mdc`，明确纯 JSX 架构、English-Only UI、Tailwind 优先等红线。
- [x] **建立自动化工作流**：编写 `workflow-api-to-ui.mdc`，强制规范从 API 文档到高品质 UI 渲染的标准化 4 步流转（模型定义 -> 数据请求 -> 骨架拆分 -> UI 组装）。
- [x] **注入顶级前端思维**：引入 `.agents/skills/` 系列技能库（包含 `vercel-composition-patterns`、`design-taste-frontend` 等），覆盖大模型默认的劣质代码偏好。
- [x] **锁定目录与拆分规则**：明确 `src/pages/` 与 `src/components/` 的边界，强制要求页面级子组件“就近存放”（Local Components 拆分原则）。

### 基础网络与鉴权层 (Networking & Auth)
- [x] **持久化鉴权状态**：基于 `zustand` 的 `persist` 中间件创建 `src/stores/authStore.js`，安全存储及管理 Token 与用户信息。
- [x] **封装 HTTP 核心单例**：引入 `axios`，在 `src/http/client.js` 中封装全局请求客户端，实现 Token 自动注入与 `401 Unauthorized` 全局拦截登出。
- [x] **确立路径剥离原则**：在代码生成规则中强制约束，业务代码中发起请求时必须剥离 `/api/v1` 等前缀，由底层全权接管。
- [x] **构建多环境动态代理**：改造 `vite.config.js`，利用 `loadEnv` 结合 `command/mode`，实现根据不同的本地启动命令 (`pnpm dev:staging` 等) 动态读取 `.env` 中的 `VITE_PROXY_TARGET` 跨域转发。

### 视觉与组件引擎 (UI & Component Engine)
- [x] **引入降维版 shadcn/ui**：执行 CLI 初始化，严格绕过 TypeScript 限制（选择 `no`），确立纯 JSX 环境下的 Copy & Paste 组件重塑模式。
- [x] **部署高级动效与图标引擎**：引入 `framer-motion` (弹簧物理动效) 与 `lucide-react` (专业线性图标)，为后续 AI 复杂交互提供原子级支撑。
- [x] **确立组件生成红线**：禁止使用 CLI 添加自带 TS 的组件。所有 shadcn 组件必须由 AI 读取官方 TS 源码后，翻译为带有完美 JSDoc 注释类型的纯 JSX 代码（如 `button.jsx` 测试验证通过）。

## 核心基建阶段 (Core Infrastructure)

### 阶段一：底层状态与通信引擎 (State & Networking)
- [x] **创建全局 Agent 状态树**：在 `src/stores/chatStore.js` 中使用 `zustand` 初始化状态（`messages`, `isTyping`, `currentWorkflowId`, `activeNodeId` 等）。
- [x] **实现定制化 SSE 客户端**：基于 `@microsoft/fetch-event-source` 实现 `sendMessage` 方法，支持 POST 请求与 Body 传递。
- [x] **打通事件路由分发层 (Event Router)**：在 SSE 的 `onmessage` 回调中，编写完整的 `switch-case` 路由，精准拦截后端的 15 种自定义事件（如 `message_chunk`, `tool_call`, `workflow_pending`, `client_interaction` 等）。
- [x] **实现历史会话同步**：引入 `@tanstack/react-query`，编写加载历史会话列表和单次会话详情的查询 Hook，并与 Zustand Store 结合。

### 阶段二：数据安全防线 (Runtime Validation)
- [x] **建立 Zod Schema 注册表**：在 `src/schemas/` 目录下，为大模型常用的输出数据结构定义 Zod Schema（特别是 Tool Call 的 `args` 结构）。
- [x] **实现交互表单校验防线**：为后端的 `client_interaction` 事件中的 `widgets` 数组定义强校验 Schema。
- [x] **封装安全解析器**：编写一个工具函数 `safeParseAIJson`，内部使用 try-catch 和 zod，确保解析失败时抛出友好错误而非白屏，并在必要时触发大模型重试。

## 视图呈现阶段 (Generative UI & Visuals)

### 阶段三：富文本与生成式 UI (Chat Interface)
- [x] **重构消息列表分发器**：创建 `src/components/Chat/ChatMain.jsx`，引入类型调度逻辑，根据 `msg.role` / `msg.metadata.type` 分别渲染文本气泡、工具卡片或交互表单。
- [x] **封装 Markdown 渲染引擎**：创建 `src/components/GenerativeUI/MarkdownMessage.jsx`，集成 `react-markdown`、`remark-gfm` 和 `react-syntax-highlighter`，实现表格和代码块的完美渲染。
- [x] **实现工具调用流转卡片 (Tool Call Card)**：创建 `ToolCallCard.jsx`，根据不同的 `toolName` 渲染对应的状态（执行中 loading、成功摘要、失败报错）。
- [x] **实现动态交互表单 (Interaction Form)**：创建 `InteractionForm.jsx`，动态渲染按钮组（ButtonGroup）、输入框（Input）等控件，并打通向后端 `toolResults` 回传的链路以恢复中断的对话。

### 阶段四：复杂节点工作流 (Workflow Engine)
- [x] **初始化 React Flow 画布**：在项目中开辟独立的工作流预览/编辑区域，引入 `@xyflow/react` 的 `<ReactFlow />` 核心组件。
- [x] **设计 AI 专属自定义节点**：基于你们的业务场景，使用 React Flow 的 `custom nodes` API 开发特殊的 LLM 节点、工具节点。
- [x] **打通画布与 Agent 状态流**：监听 Zustand Store 中的 `activeNodeId`。当接收到后端的 `node_pending` 或 `node_complete` 事件时，在 React Flow 画布中实时高亮正在执行的节点及连线动画。