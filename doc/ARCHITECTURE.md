# 🚀 ABC Tenant Console - 前端架构说明书 (Architecture Specification)

## 1. 架构愿景与项目概览
本项目是一个深度集成 **大语言模型 (LLM)** 与 **复杂节点工作流 (Workflow)** 的现代化前端应用。
为了在保证极速构建与开发体验的同时，能够稳健承载大模型流式通信与庞大的图节点状态，项目确立了**“轻量级底座 + 专业领域引擎 + 严格运行时防线”**的架构设计思想。

---

## 2. 核心底层技术栈 (Base Infrastructure)
项目的基础骨架遵循极简且现代化的原则：
- **核心框架**: React 18.3
- **构建工具**: Vite 7
- **样式方案**: TailwindCSS v4 (通过 `@tailwindcss/vite` 插件集成，无配置文件)
- **包管理器**: pnpm
- **语言规范**: **纯 JSX** (不使用 TypeScript，通过运行时校验弥补类型安全)
- **代码检查**: ESLint 9 (Flat Config, Airbnb 规则基准)
- **图标系统**: `lucide-react`

---

## 3. 六大核心业务架构模块 (Core Modules)

为了支撑复杂的 AI 业务，我们在基础框架之上引入了六大专业技术模块：

### 模块一：基础网络与鉴权层 (Networking & Auth)
- **选型**: `axios`（封装于 `src/http/client.js`，导出全局单例 `apiClient`）
- **定位**: 所有常规 RESTful API 请求（增删改查、登录、配置拉取等）的**唯一出口**。内置 Token 自动注入（request interceptor）与 401 未授权拦截（response interceptor）。登录态通过 `src/stores/authStore.js` 使用 zustand `persist` 中间件持久化。
- **架构红线**: 常规 HTTP 请求**严禁裸写 `fetch` 或直接 `axios.get`**，必须统一使用 `import { apiClient } from '@/http/client'`。大模型 SSE 流式通信则严格走 `@microsoft/fetch-event-source`，两条通道各司其职、互不混用。
- **路由接力机制**: 请求 URL 经过三级接力到达真实后端：`Axios baseURL (/api)` → `Vite Proxy 拦截 (/api)` → `Rewrite 重写为 (/api/v1)` → 真实后端。因此代码中**严禁携带 `/api` 或 `/v1` 前缀**，只写纯业务路径：
  - ❌ `apiClient.get('/api/v1/users')` — 会导致 404
  - ✅ `apiClient.get('/users')` — 正确写法

### 模块二：LLM 流式通信引擎 (Streaming Networking)
- **选型**: `@microsoft/fetch-event-source`
- **定位**: 替代原生的 `fetch` 和 `EventSource`，专职处理携带复杂 Body 的 `POST` 请求以及 Server-Sent Events (SSE) 流式响应。
- **架构决策**: 明确**禁止使用 Vercel AI SDK (`ai`)**。因为后端提供了深度定制的 Agent 生命周期协议（如 `message_chunk`, `workflow_pending`, `client_interaction`），必须由前端实现一套精细化的事件路由分发器。

### 模块三：复杂状态管理与同步 (Global State Management)
- **选型**: `zustand`
- **定位**: 替代 React Context 解决高频渲染问题。
- **职责**: 负责承载跨组件的会话数据 (`messages`)、UI 交互打断状态，以及 React Flow 画布中节点运行的实时高亮状态。

### 模块四：工作流可视化引擎 (Workflow Engine)
- **选型**: `@xyflow/react` (原 React Flow)
- **定位**: 支撑 AI 生成的可视化工作流。提供无限画布、节点拖拽、连线逻辑以及缩放引擎，作为 Agent 逻辑编排的视觉出口。

### 模块五：生成式 UI 与富文本渲染 (Generative UI & Markdown)
- **选型**: `react-markdown` + `remark-gfm` + `react-syntax-highlighter`
- **定位**: 将大模型吐出的纯文本转化为高质量的视觉组件。不仅支持标准 Markdown、代码块高亮与表格，更通过组件分发机制，支持动态渲染“工具调用卡片 (Tool Call Card)”和“用户交互表单 (Interaction Form)”。

### 模块六：服务端状态与缓存调度 (Server State & Caching)
- **选型**: `@tanstack/react-query`
- **定位**: 接管所有非 SSE 的传统 REST API 请求（如历史记录拉取、会话列表、草稿同步）。提供开箱即用的缓存控制、自动重试与乐观更新机制。

---

## 4. 关键架构决策记录 (Architecture Decision Records - ADR)

### ADR 001: 纯 JSX 环境下的运行时边界防御
- **背景**: 项目未采用 TypeScript，大模型返回的 JSON 数据具有极高的不确定性（幻觉）。
- **决策**: 引入 **`zod`** 作为核心数据的运行时安检门。
- **规范**: 任何从大模型解析出的 Tool Call 参数，或从远端加载的工作流 Nodes/Edges 数据，在写入 Zustand Store 或渲染到组件前，**必须**通过 Zod Schema 进行校验拦截。解析失败需抛出友好错误并支持自动重试，严禁因数据结构残缺导致页面白屏。

### ADR 002: 自定义 SSE 状态分发路由
- **背景**: 后端 SSE 接口下发多种高阶控制指令。
- **决策**: 在 `useAgentChatStore` 中，基于 `fetchEventSource` 的 `onmessage` 建立统一的 `switch-case` 路由拦截器。
- **规范**: 必须精确处理 `start`, `message_chunk`, `tool_call`, `client_interaction`, `workflow_pending`, `node_complete` 等自定义事件，统一修改全局状态，禁止在 UI 组件内部裸写网络请求逻辑。

### ADR 003: 纯客户端的动态 UI 注册机制
- **背景**: 无法使用 React Server Components，但需要实现聊天窗口内嵌入动态表单和工作流卡片。
- **决策**: 实施**组件注册表与按类型分发**策略。
- **规范**: 统一在 `ChatMain/MessageList` 组件中，根据 `msg.type`（如 `text`, `tool_call`, `interaction`）动态挂载不同的 React 组件。所有动态组件代码需收敛在 `src/components/GenerativeUI/` 目录下。

---

## 5. 工程与目录结构规范

```text
src/
  assets/              # 静态资源（图片存放至 images/，禁止使用外部过期 URL）
  components/          # 全局跨页面复用组件 (含 AppRail, Sidebar 等)
    GenerativeUI/      # AI 动态生成的交互组件 (Tool Cards, Forms)
  http/                # axios 封装 (client.js 导出全局 apiClient 单例)
  hooks/               # 封装后的 React Query 等自定义 Hook
  pages/               # 页面级组件 (必须以文件夹组织)
    Home/              
      index.jsx        # 页面入口
      components/      # 仅在 Home 页面私有的组件
  stores/              # Zustand 状态切片 (如 chatStore.js, workflowStore.js)
  utils/               
    schemas/           # Zod 运行时校验规则文件
  router.jsx           # 全局路由配置

```

---

## 6. AI Agent 辅助编程约束

所有参与本工程代码生成的 AI Agent（包括 Cursor / Copilot 等），必须在编码前读取并遵循 `.cursor/rules/` 目录下的所有 `.mdc` 规则文件：

* 严格遵循纯 JSX 规范与 Tailwind 优先原则。
* 绝不擅自引入第三方竞品库（如 `vercel/ai`）。
* 组件修改必须符合上述 ADR 架构决策。
* **English-Only UI**：所有面向用户的界面文本（按钮、表头、Placeholder、Toast、空态文案等）必须使用专业英文，严禁在 JSX/JS 代码中出现中文字符。即使 API 文档或 Prompt 为中文，AI Agent 也必须自动翻译为地道的英文后再生成代码。