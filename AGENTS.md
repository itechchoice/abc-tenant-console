# 项目概览

本项目使用以下技术栈：

- **React 18.3**（非 React 19，不使用 Server Components）
- **Vite 7** 作为构建工具
- **TailwindCSS v4**（通过 `@tailwindcss/vite` 插件集成，无需 `tailwind.config.js`）
- **ESLint 9**（flat config 格式，基于 Airbnb 规则并做了合理放宽）
- **lucide-react** 作为图标库
- **pnpm** 作为包管理器
- **纯 JSX**，不使用 TypeScript

路径别名：`@` 指向 `src/` 目录。

## 编码规范

- 使用函数式组件 + Hooks，不使用 class 组件
- 组件文件使用 `.jsx` 扩展名
- 使用 ES Module（`import/export`），项目 `"type": "module"`
- 样式优先使用 TailwindCSS 的 utility class，避免手写 CSS
- `console.log` 可保留用于调试（ESLint 仅 warn），但提交前应清理
- 不需要 `import React from 'react'`（React 18 JSX transform 已自动处理）

## 文件组织

```
src/
  main.jsx              # 入口
  App.jsx               # 根组件
  index.css             # 全局样式（含 TailwindCSS 导入）
  components/           # 跨页面复用的通用组件
  hooks/                # 自定义 Hooks
  pages/                # 页面级组件（按文件夹组织）
    Home/
      index.jsx         # 页面入口
      index.css         # 仅在 TailwindCSS 无法满足时才创建
      components/       # 该页面私有的组件（不通用、仅当前页面使用）
    NotFound/
      index.jsx
  utils/                # 工具函数
  assets/               # 静态资源（图片、字体等）
```

### 页面与组件的组织原则

- **`src/pages/`**：每个页面一个文件夹，以 `index.jsx` 作为入口。页面私有的子组件放在该页面文件夹下的 `components/` 中
- **`src/components/`**：仅存放跨页面复用的通用组件。如果一个组件只有某个页面在用，应放在该页面的 `components/` 中
- 页面文件夹内的 `index.css` 仅在 TailwindCSS utility class 无法满足样式需求时才创建
- 当一个页面私有组件开始被其他页面引用时，应将其提升到 `src/components/`

## 重要约定

- 安装依赖使用 `pnpm add`，不要使用 npm 或 yarn
- 新增依赖时不要手动指定版本号，让 pnpm 解析最新版
- 配置文件（`vite.config.js`、`eslint.config.js`）放在项目根目录
- TailwindCSS v4 通过 `@import "tailwindcss"` 在 CSS 中引入，不需要 `@tailwind` 指令
