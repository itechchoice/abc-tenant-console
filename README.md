# ABC Tenant Console

`ABC Tenant Console` 是一个多租户 AI Agent 控制台前端，提供流式聊天、工具调用可视化、工作流执行画布与动态交互表单能力。项目当前已经完成 **JavaScript/JSX -> TypeScript/TSX** 全量迁移，运行在 React 18 + Vite 7 的纯前端 CSR 架构上。

## 项目定位

这个项目主要解决三类前端问题：

1. 以聊天界面承载 AI Agent / Model 的对话交互。
2. 以实时工作流画布展示后端执行过程、节点状态和步骤时间线。
3. 以 Generative UI 渲染 AI 返回的富文本、工具调用卡片和交互表单。

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 前端框架 | React 18.3 |
| 路由 | React Router 7 |
| 构建工具 | Vite 7 |
| 语言 | TypeScript 5（strict） |
| 样式系统 | Tailwind CSS v4 |
| UI 组件 | shadcn/ui |
| 动画 | framer-motion |
| 图标 | lucide-react |
| 客户端状态 | Zustand |
| 服务端状态 | TanStack React Query v5 |
| HTTP | axios |
| 流式通信 | `@microsoft/fetch-event-source` |
| 工作流画布 | `@xyflow/react` |
| 运行时校验 | Zod |
| 代码规范 | ESLint 9 Flat Config |

## 当前能力概览

- 支持 `auto / agent / model` 三种聊天模式切换。
- 支持基于 SSE 的流式消息增量渲染。
- 支持工具调用、客户端交互、任务生命周期等多类事件处理。
- 支持历史会话列表、会话详情回放、运行中任务重连。
- 支持工作流步骤时间线、节点高亮、执行摘要面板。
- 支持 Markdown、代码块、工具卡片、交互表单等多态消息渲染。

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 9

### 安装与启动

```bash
pnpm install
pnpm dev
```

默认开发地址为 `http://localhost:5173`。

### 其他脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 开发模式启动 |
| `pnpm stg` | 以 staging 模式启动 |
| `pnpm prod` | 以 production 模式启动 |
| `pnpm build` | 生产构建输出到 `dist/` |
| `pnpm preview` | 本地预览构建结果 |
| `pnpm lint` | 运行 ESLint |
| `pnpm lint:fix` | 自动修复 ESLint 问题 |

## 环境变量

项目使用：

- `.env.development`
- `.env.staging`
- `.env.production`

关键变量如下：

```bash
VITE_APP_BASE_PATH=/tenant-console/
VITE_API_BASE_URL=/tenant-console-api
VITE_PROXY_TARGET=https://arch.stg.alphabitcore.io
```

含义说明：

- `VITE_APP_BASE_PATH`：Vite 静态资源前缀，同时决定 React Router 的 `basename`
- `VITE_API_BASE_URL`：前端 axios 请求前缀
- `VITE_PROXY_TARGET`：本地开发时 Vite 代理转发的真实后端地址

开发环境下的请求路径链路为：

`apiClient` -> `Vite Proxy` -> `/api/v1` 重写 -> 后端服务

## 目录结构

```text
src/
  main.tsx                     # 入口，注册 QueryClient / RouterProvider
  App.tsx                      # 根路由 outlet
  router.tsx                   # 路由定义
  index.css                    # 全局样式
  components/                  # 共享组件与跨页面能力组件
  hooks/                       # React hooks（查询、流式聊天、标题等）
  http/                        # Axios 客户端
  lib/                         # 通用工具
  pages/                       # 页面与页面私有组件
  schemas/                     # Zod schema + z.infer 类型导出
  stores/                      # Zustand stores
  utils/                       # 通用辅助函数
  assets/                      # 静态资源
```

更细的模块说明见：

- [`src/components/README.md`](src/components/README.md)
- [`src/hooks/README.md`](src/hooks/README.md)
- [`src/http/README.md`](src/http/README.md)
- [`src/lib/README.md`](src/lib/README.md)
- [`src/pages/README.md`](src/pages/README.md)
- [`src/schemas/README.md`](src/schemas/README.md)
- [`src/stores/README.md`](src/stores/README.md)
- [`src/utils/README.md`](src/utils/README.md)

## 核心架构

### 1. 路由层

当前路由非常轻量，只有 3 个页面入口：

- `/login`：登录页
- `/`：主工作台
- `*`：404

`RootLayout` 负责页面标题同步，`App` 负责承载内部 `Outlet`。

### 2. 数据与状态分层

项目采用明确的“双状态源”设计：

- `Zustand`：存放高频、交互态、本地 UI 状态
- `React Query`：存放服务端查询结果和 mutation 生命周期

当前实践大致如下：

- `authStore`：登录态、用户信息
- `chatStore`：当前会话、消息列表、模型选择、聊天模式
- `workflowRuntimeStore`：工作流执行步骤、阶段、当前选中节点、摘要

### 3. 聊天与流式事件

`useAgentChat` 是项目最核心的业务 hook 之一，负责：

- 发送消息
- 连接 SSE
- 处理 `INIT / TOKEN_STREAM / TOOL_CALL / TASK_* / client_interaction` 等事件
- 更新聊天 store 与工作流 runtime store

项目支持两条发送路径：

1. 新对话：`POST /chat` + SSE
2. 历史会话：`POST /tasks` 后再连接 `/tasks/{id}/events`

### 4. 运行时校验

所有关键结构都通过 `src/schemas/` 中的 Zod schema 统一建模，再导出 TypeScript 类型：

- 消息 / 会话
- 模型提供方
- AI 交互表单
- 工作流运行时步骤与摘要

这意味着项目同时具备：

- TypeScript 编译期类型安全
- Zod 运行时数据校验

### 5. 组件分层

共享组件主要分成三类：

- `Chat`：聊天消息渲染主干
- `GenerativeUI`：富文本、工具卡片、交互表单
- `Workflow`：画布、节点、执行时间线与检查面板

页面层则集中在 `src/pages/`，其中 `Home` 是主工作台，负责把左侧会话栏、中间聊天区、右侧工作流画布组合起来。

## 与后端的主要交互

当前前端主要依赖以下后端能力：

- 登录：`/auth/login`
- 模型列表：`/models/providers/assigned`
- 会话列表：`/sessions`
- 会话详情：`/sessions/:id`
- 新建任务：`/tasks`
- 聊天流：`/chat`
- 任务事件流：`/tasks/:taskId/events`

HTTP 请求统一通过 `src/http/client.ts` 发出，并自动注入 token、处理 401 跳转。

## 开发约定

- 所有业务源码统一使用 TypeScript / TSX。
- 类型优先从 `Zod schema + z.infer` 导出，不再使用 JSDoc 类型桥接。
- REST 请求统一走 `apiClient`，不要在业务组件里直接写裸 `axios`。
- 高频交互态进 Zustand，服务端查询态进 React Query。
- 页面私有组件优先放在对应页面目录下，跨页面复用组件再放入 `src/components/`。

## 文档维护建议

后续如果新增模块，请同时补充对应目录下的 `README.md`，至少说明：

- 模块职责
- 核心文件
- 对外暴露能力
- 依赖关系
- 使用注意事项

## License

内部项目，默认不对外公开。
