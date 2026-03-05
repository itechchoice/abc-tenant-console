# ABC Tenant Console — Frontend Architecture Specification

> **Language Commitment**: 本项目坚定采用 **Pure JSX (纯 JSX) + JSDoc** 路线。
> 项目中不存在任何 `.ts` / `.tsx` 文件，不使用 TypeScript 编译器。
> 类型安全通过 **Zod Schema (SSOT)** + **JSDoc `@typedef` / `@param`** 在运行时与编辑器层面双重保障。

---

## 1. Architecture Vision (架构愿景)

本项目是一个深度集成 **Large Language Model (大语言模型)** 与 **Visual Workflow (可视化节点工作流)** 的现代化前端应用。架构设计思想为：

**"轻量级底座 + 专业领域引擎 + 严格运行时防线"**

所有从 0→1 规划的四大阶段——状态与通信引擎、运行时安全防线、生成式 UI、工作流可视化——均已完成核心代码落地。

---

## 2. Base Infrastructure (核心底层技术栈)

| Layer | Choice |
|-------|--------|
| Framework | React 18.3 (CSR only, no Server Components) |
| Build Tool | Vite 7 |
| Styling | TailwindCSS v4 (`@tailwindcss/vite`, zero-config) |
| Component Library | shadcn/ui (Pure JSX 降维版, Copy & Paste 模式) |
| Animation Engine | framer-motion (弹簧物理动效 + 页面过渡) |
| Icon System | lucide-react |
| Utility | `cn()` — clsx + tailwind-merge (`src/lib/utils.js`) |
| Linting | ESLint 9 (Flat Config, Airbnb 基准) |
| Package Manager | pnpm |
| Language | **Pure JSX** — TypeScript 严禁混入 |

---

## 3. Core Architecture Layers (核心架构分层)

### Layer 1: State & Network Engine (状态与通信层)

本层是整个 AI Chat 应用的 **中央神经系统**，负责管理全局会话状态和大模型双向通信。

#### 1a. Global State Brain — `useChatStore` (Zustand)

`src/stores/chatStore.js` 作为中央数据大脑，使用 `zustand` 管理以下状态切片：

| State Slice | Type | Description |
|-------------|------|-------------|
| `messages` | `Message[]` | 当前会话的全量消息流（按时序排列） |
| `isTyping` | `boolean` | LLM 是否正在通过 SSE 流式吐字 |
| `currentSessionId` | `string \| null` | 当前活跃会话 ID |
| `currentWorkflowId` | `string \| null` | Agent 激活的工作流 ID |
| `activeNodeId` | `string \| null` | 正在执行的工作流节点 ID（驱动画布呼吸灯） |

**关键 Actions**：`addMessage` / `updateMessage`（流式追加）、`setWorkflowInfo`（原子更新工作流 + 节点状态）、`clearChat`（确定性状态重置）。

所有 State 与 Actions 均通过严格的 **JSDoc `@typedef`** 标注，在纯 JS 环境中实现完美的 IntelliSense 补全。

#### 1b. SSE Streaming Client — `useAgentChat` Hook

`src/hooks/useAgentChat.js` 封装了完整的 LLM 流式对话生命周期：

- **底层传输**：基于 `@microsoft/fetch-event-source`，以 `POST` + 自定义 Header（Bearer Token, X-Tenant-Id）发起 SSE 连接。
- **Event Router (事件路由分发器)**：在 `onmessage` 回调中，通过 `switch (msg.event)` 精准拦截后端的全部自定义事件类型：

| Event | Protocol | Handler |
|-------|----------|---------|
| `INIT` | v2 | 捕获 `sessionId`，写入 Store，触发 `onSessionCreated` 回调 |
| `TEXT_CHUNK` | v2 | 实时追加 token delta 到 assistant message |
| `COMPLETED` | v2 | 标记流结束，写入最终完整内容 |
| `message_chunk` | legacy | 流式追加（兼容旧协议） |
| `tool_call` | legacy | 创建 tool message，渲染 Tool Call Card |
| `workflow_pending` / `node_pending` | — | 调用 `setWorkflowInfo` 驱动画布节点高亮 |
| `node_complete` | — | 清除节点高亮 |
| `client_interaction` | — | 中断流，渲染动态交互表单 |
| `error` | — | 标记消息错误状态，停止 typing indicator |

- **Optimistic Update (乐观更新)**：发送消息时立即插入用户气泡 + 占位 assistant 气泡，实现零延迟 UI 反馈。
- **AbortController**：支持用户主动中断流式响应（`stopStream`）。

#### 1c. Server State & Caching — React Query

`src/hooks/useChatHistory.js` 使用 `@tanstack/react-query` 封装历史会话的读取：

- `useConversations()` — 拉取会话列表（驱动侧边栏）
- `useConversationDetail(sessionId)` — 加载单次会话详情，自动同步到 Zustand Store（`setMessages`）

所有常规 REST 请求统一通过 `apiClient`（`src/http/client.js`，基于 axios 封装，含 Token 注入 + 401 拦截）发出。

#### 1d. Networking Architecture Red Lines (网络架构红线)

- SSE 流式通信 → `@microsoft/fetch-event-source`（唯一通道）
- 常规 RESTful → `apiClient`（唯一出口）
- **严禁**：裸写 `fetch`、直接 `axios.get`、`vercel/ai` 的 `useChat`、原生 `EventSource`
- **路由接力**：`Axios baseURL (/api)` → `Vite Proxy (/api)` → `Rewrite (/api/v1)` → 真实后端。代码中严禁携带 `/api` 或 `/v1` 前缀。

---

### Layer 2: Runtime Security (运行时安全防线)

在无 TypeScript 的纯 JSX 环境中，大模型返回的 JSON 具有极高的不确定性（Hallucination / 幻觉）。本层基于 `zod` 构建了一道运行时安检门。

#### 2a. Schema Registry (Schema 注册表)

`src/schemas/` 目录下按领域维护 Zod Schema 定义：

| File | Coverage |
|------|----------|
| `chatSchema.js` | `MessageSchema`、`ToolCallSchema`、`MessageRoleSchema`、`MessageStatusSchema` — 消息管道的 SSOT |
| `aiResponseSchemas.js` | `toolCallArgsSchema`、`interactionWidgetSchema`、`interactionPayloadSchema` — AI 结构化输出的防线 |

每个 Schema 文件底部均通过 `z.infer<typeof ...>` + `@typedef` 导出 JSDoc 类型，确保在纯 JS 中获得完美的 IDE 提示。

#### 2b. Defensive Parsing (防御性解析)

- 所有从 SSE payload 解析出的 JSON 数据，在写入 Zustand Store 或渲染到组件前，必须通过对应 Schema 的 `.parse()` 或 `.safeParse()` 校验。
- 解析失败时，在 Store 层 `try-catch` 捕获，抛出友好错误提示，**严禁异常导致 React 渲染树崩溃（白屏）**。
- 工具函数 `safeParseAIJson` 封装了完整的容错闭环，必要时可触发 LLM 重试。

---

### Layer 3: Generative UI (生成式界面)

本层将大模型吐出的非结构化文本和结构化指令，转化为高质量的可交互视觉组件。所有生成式组件收敛在 `src/components/GenerativeUI/` 目录下。

#### 3a. Polymorphic Message Dispatcher (多态消息分发器)

`ChatPanel` 组件中的消息列表根据 `msg.role` + `msg.metadata.type` 进行类型分发，动态挂载不同的渲染组件：

| `msg` 类型 | 渲染组件 | 说明 |
|------------|----------|------|
| `role: 'user'` | 用户气泡 | 纯文本，右对齐 |
| `role: 'assistant'` (text) | `MarkdownMessage` | 富文本渲染 |
| `metadata.type: 'tool_call'` | `ToolCallCard` | 工具调用流转卡片 |
| `metadata.type: 'interaction'` | `InteractionForm` | 动态交互表单 |

#### 3b. `MarkdownMessage` — AI Rich Text Renderer (富文本渲染引擎)

`src/components/GenerativeUI/MarkdownMessage.jsx`

- **渲染管线**：`react-markdown` → `remark-gfm`（表格 / 删除线 / 任务列表）→ 自定义 `components` 覆盖
- **代码高亮**：通过 `react-syntax-highlighter` + `oneDark` 主题实现语法着色，内置独立的 `CodeBlock` 子组件（`memo` 隔离复制状态，避免父级重渲染）
- **Copy to Clipboard**：每个代码块右上角带有 `Copy / Copied` 按钮，使用 `framer-motion` `AnimatePresence` 实现切换动效

#### 3c. `ToolCallCard` — Tool Execution Lifecycle Card (工具调用流转卡片)

`src/components/GenerativeUI/ToolCallCard.jsx`

按 `status` 渲染三态 UI：
- `pending` → 脉冲加载动效 (`Loader2` spinning)
- `success` → 成功摘要（可折叠的 JSON 结果面板）
- `error` → 错误状态（`AlertTriangle` 图标 + 错误信息）

#### 3d. `InteractionForm` — Dynamic Client Interaction (动态交互表单)

`src/components/GenerativeUI/InteractionForm.jsx`

当后端下发 `client_interaction` 事件时，根据 `widgets` 数组动态渲染：
- `input` → 自由文本输入框
- `select` → 下拉选择器
- `button` → 操作触发按钮

用户提交后通过 `onSubmit` 回调将 `{ actionId, formData }` 回传，恢复被中断的对话流。组件入参通过 `interactionWidgetSchema` 强校验。

---

### Layer 4: Workflow Canvas (可视化工作流引擎)

基于 `@xyflow/react` (React Flow) 构建的响应式连线画布，作为 Agent 逻辑编排的视觉出口。

#### 4a. Canvas Foundation

- `<ReactFlow />` 核心组件提供无限画布、节点拖拽、连线逻辑与缩放控制
- 自定义 `AgentNode` 节点类型，通过 React Flow 的 `nodeTypes` 注册机制挂载

#### 4b. Breathing Light Effect (实时呼吸灯联动)

画布通过订阅 Zustand Store 中的 `activeNodeId` 实现状态驱动的视觉反馈：

1. 后端 SSE 下发 `node_pending` 事件 → `useAgentChat` Event Router 调用 `setWorkflowInfo(workflowId, nodeId)`
2. Zustand Store 更新 `activeNodeId`
3. React Flow 画布中对应的 `AgentNode` 检测到自身 ID 匹配，激活呼吸灯 CSS 动效（脉冲边框 + 发光阴影）
4. 后端下发 `node_complete` → `setWorkflowInfo(workflowId, null)` → 呼吸灯熄灭

整条链路 **零手动 DOM 操作**，完全由 Zustand Selector → React re-render 驱动。

---

## 4. Architecture Decision Records (关键架构决策记录)

### ADR 001: Pure JSX + Zod 的运行时边界防御
- **背景**: 项目不使用 TypeScript，LLM 返回的 JSON 具有极高不确定性。
- **决策**: 以 `zod` Schema 为 SSOT，`JSDoc @typedef` 为编辑器类型推导工具。
- **规范**: 所有外部数据写入 Store 前必须 Schema 校验，失败时友好降级，严禁白屏。

### ADR 002: 自定义 SSE Event Router
- **背景**: 后端 SSE 接口下发 10+ 种高阶控制指令，远超标准 AI SDK 承载范围。
- **决策**: 在 `useAgentChat` Hook 中基于 `fetchEventSource` 的 `onmessage` 实现精细化 `switch-case` 路由。
- **规范**: 同时兼容 v2 协议（`INIT` / `TEXT_CHUNK` / `COMPLETED`）和 legacy 协议（`message_chunk` / `complete`），所有状态变动统一通过 Zustand `set` 派发。

### ADR 003: Generative UI — Component Registry & Type Dispatch
- **背景**: 纯客户端渲染，无法使用 React Server Components，但需在聊天窗口内嵌入动态表单和工具卡片。
- **决策**: 基于 `msg.type` 在消息列表中进行多态组件分发。
- **规范**: 所有生成式组件收敛于 `src/components/GenerativeUI/`，新增组件类型时只需扩展分发映射表。

### ADR 004: shadcn/ui — Copy & Paste Pure JSX 降维
- **背景**: 需要高质量基础组件库，但 shadcn CLI 生成的代码含 TypeScript。
- **决策**: 由 AI 读取 shadcn 官方 TS 源码，手动转化为带完整 JSDoc 注释的纯 JSX，存放于 `src/components/ui/`。
- **规范**: **严禁运行 `npx shadcn add`**，所有组件必须保留 `cn()` 动态类名拼接逻辑。

---

## 5. Directory Structure (工程目录结构)

```text
src/
  assets/              # Static resources (images → images/, no external expired URLs)
  components/          # Global cross-page reusable components
    ui/              # shadcn/ui Pure JSX components (Button, Dialog, Input …)
    GenerativeUI/    # AI-driven polymorphic components
      MarkdownMessage.jsx   # Rich-text renderer (react-markdown + syntax highlight)
      ToolCallCard.jsx      # Tool execution lifecycle card (3-state UI)
      InteractionForm.jsx   # Dynamic client interaction form
  lib/
    utils.js         # cn() utility (clsx + tailwind-merge)
  http/
    client.js        # axios singleton (Token injection + 401 interception)
  hooks/
    useAgentChat.js  # SSE streaming lifecycle + event router
    useChatHistory.js# React Query wrappers for conversation CRUD
  stores/
    chatStore.js     # Zustand — central chat + workflow state brain
    authStore.js     # Zustand + persist — login credentials & token
  schemas/
    chatSchema.js    # Zod SSOT — Message, ToolCall, Role, Status
    aiResponseSchemas.js  # Zod — Tool Call args, Interaction widgets
  pages/               # Page-level components (folder-per-page)
    Home/
      index.jsx        # Page entry — assembles local components
      components/      # Page-private components
        ChatPanel.jsx          # Chat interface (input + message list)
        ConversationSidebar.jsx# History sidebar
    Login/
      index.jsx
    NotFound/
      index.jsx
  router.jsx           # Global route configuration
```

---

## 6. AI Agent Programming Constraints (AI Agent 辅助编程约束)

所有参与本工程代码生成的 AI Agent（包括 Cursor / Copilot 等），必须在编码前读取并遵循 `.cursor/rules/` 目录下的所有 `.mdc` 规则文件：

- 严格遵循 **Pure JSX** 规范与 **TailwindCSS-first** 原则，严禁混入任何 TypeScript 语法。
- 绝不擅自引入第三方竞品库（如 `vercel/ai`），绝不运行 `npx shadcn add`。
- 所有状态变动必须通过 Zustand `set` / `get()` 派发，禁止在 UI 组件内裸写网络请求逻辑。
- 组件修改必须符合上述 ADR 架构决策。
- **English-Only UI**: 所有面向用户的界面文本必须使用专业英文，严禁在 JSX/JS 代码中出现中文字符。即使 API 文档或 Prompt 为中文，也必须自动翻译为地道英文后再生成代码。
