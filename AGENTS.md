# 项目概览

本项目当前已经完成 **JavaScript/JSX -> TypeScript/TSX** 全量迁移，使用以下技术栈：

- **React 18.3**（非 React 19，不使用 Server Components）
- **Vite 7** 作为构建工具
- **TypeScript 5**（`strict` 模式）
- **TailwindCSS v4**（通过 `@tailwindcss/vite` 插件集成，无需 `tailwind.config.js`）
- **ESLint 9**（flat config 格式，基于 Airbnb 规则并做了合理放宽）
- **shadcn/ui** — 基础 UI 组件库，组件位于 `src/components/ui/`
- **framer-motion** — 动画引擎（微交互、页面过渡、弹簧动效）
- **lucide-react** — 图标库
- **clsx** + **tailwind-merge** — 动态类名拼接（封装为 `cn()`，位于 `src/lib/utils.ts`）
- **zustand** — 高频客户端状态管理
- **@tanstack/react-query** — 服务端状态与缓存
- **react-markdown** + **remark-gfm** + **react-syntax-highlighter** — AI Markdown 渲染方案
- **@xyflow/react**（React Flow）— Workflow 画布与节点图可视化引擎
- **@microsoft/fetch-event-source** — SSE 流式通信底座
- **zod** — 运行时数据校验
- **axios** — 常规 HTTP 请求底层（封装于 `src/http/client.ts`，含 Token 注入与 401 拦截）
- **pnpm** 作为包管理器

路径别名：`@` 指向 `src/` 目录。

## 编码规范

- 使用函数式组件 + Hooks，不使用 class 组件
- React 组件文件使用 `.tsx`，非组件业务模块优先使用 `.ts`
- 使用 ES Module（`import/export`），项目 `"type": "module"`
- 样式优先使用 TailwindCSS utility class，避免手写 CSS
- `console.log` 可保留用于调试（ESLint 仅 warn），但提交前应清理
- 不需要 `import React from 'react'`（React 18 JSX transform 已自动处理）
- **类型系统**：使用 TypeScript + Zod 双层方案；TypeScript 负责编译期安全，Zod 负责运行时校验
- **类型导出约定**：优先从 schema 导出类型，例如 `export type Message = z.infer<typeof MessageSchema>`
- **JSDoc 约定**：不再使用 JSDoc 承担类型定义职责；仅在确有必要时保留“解释为什么”的说明性注释
- **状态管理**：跨组件/高频更新的客户端状态使用 zustand（store 文件放 `src/stores/`）；简单的局部 UI 状态仍用 `useState`
- **数据请求**：远端 API 读取优先通过 `@tanstack/react-query` 的 `useQuery`，提交类操作优先通过 `useMutation`
- **网络请求红线**：常规 HTTP 请求必须统一使用 `import { apiClient } from '@/http/client'`，**禁止裸写 `fetch` 或直接 `axios.get`**；大模型 SSE 流式请求走 `@microsoft/fetch-event-source`
- **API 路径前缀剥离**：所有基于 `apiClient` 的请求 URL 必须是纯净的相对业务路径（如 `/users`、`/sessions`、`/tasks`），**禁止携带 `/api` 或 `/v1` 前缀**，这些前缀由 `baseURL` 和 Vite Proxy rewrite 接管
- **Markdown 渲染**：AI 输出内容统一使用 `react-markdown`，搭配 `remark-gfm` 和 `react-syntax-highlighter`，不要自行拼接 `dangerouslySetInnerHTML`
- **Workflow 画布**：节点图/流程编排统一基于 `@xyflow/react` 构建，不要引入其他画布库
- **SSE 流式通信**：统一使用 `@microsoft/fetch-event-source` 处理大模型流式响应；**禁止使用 `vercel/ai` 的 `useChat`，也禁止使用原生 `EventSource`**
- **数据校验**：所有远端复杂配置和 AI 生成的结构化 JSON，在进入业务组件或写入 store **之前**必须通过 Zod schema 校验；若解析失败，必须被安全捕获，**禁止让异常导致 React 渲染树崩溃（白屏）**
- **类型红线**：避免 `any`；如果必须放宽，优先使用 `unknown` 再做收窄

## 文件组织

```text
src/
  main.tsx              # 入口，注册 QueryClient / RouterProvider
  App.tsx               # 根路由组件
  router.tsx            # 路由定义
  index.css             # 全局样式
  components/           # 跨页面复用的共享组件
    ui/                 # shadcn/ui 基础组件
    Chat/               # 聊天消息渲染主干
    GenerativeUI/       # AI 动态交互组件（Markdown、Tool Cards、Forms）
    Workflow/           # Workflow 画布、节点与执行详情
  lib/
    utils.ts            # cn() 工具函数
  http/
    client.ts           # axios 全局 apiClient 单例
  hooks/                # 自定义 Hooks
  stores/               # zustand store 文件
  schemas/              # zod schema + z.infer 类型导出
  pages/                # 页面级组件（按文件夹组织）
    Home/
      index.tsx         # 页面入口
      components/       # 页面私有组件
    Login/
      index.tsx
    NotFound/
      index.tsx
  utils/                # 工具函数
  assets/               # 静态资源（图片、字体等）
```

### 页面与组件的组织原则

- **`src/pages/`**：每个页面一个文件夹，以 `index.tsx` 作为入口。页面私有子组件放在该页面文件夹下的 `components/` 中
- **`src/components/`**：仅存放跨页面复用的组件。如果一个组件只在某个页面内使用，应放在该页面的 `components/` 中
- 页面文件夹内只有在 TailwindCSS utility class 无法满足时，才考虑额外样式文件
- 当页面私有组件开始被其他页面复用时，应将其提升到 `src/components/`

## 重要约定

- **shadcn 组件约定**：允许使用 `npx shadcn add <component>` 引入标准组件，但生成结果必须按项目结构、样式和 TypeScript 规范进行适配
- **UI 纯英文原则 (English-Only UI)**：项目中所有面向用户的静态文本（按钮文案、表头、Placeholder、Toast、空态文案等）**必须使用专业英文**，不要在业务 UI 代码中混入中文文案
- 安装依赖使用 `pnpm add`，不要使用 npm 或 yarn
- 新增依赖时不要手动指定版本号，让 pnpm 解析最新版
- 配置文件（`vite.config.js`、`eslint.config.js`、`tsconfig.json`）放在项目根目录
- TailwindCSS v4 通过 `@import "tailwindcss"` 在 CSS 中引入，不需要 `@tailwind` 指令
