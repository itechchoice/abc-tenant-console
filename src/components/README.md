# components 模块说明

`src/components/` 存放跨页面共享的组件与具备独立业务语义的 UI 能力模块。这里的组件通常不会只服务单一页面，而是围绕聊天、生成式消息渲染和工作流可视化展开。

## 目录划分

- `RootLayout.tsx`：根布局，负责页面标题同步后渲染路由出口。
- `Chat/`：聊天消息列表与单条消息渲染骨架。
- `GenerativeUI/`：多态消息内容渲染。
- `Workflow/`：工作流画布、节点与执行详情相关组件。
- `ui/`：基础 UI 组件。

## 设计原则

1. 共享组件才放在 `src/components/`，页面私有组件应留在对应页面目录。
2. 组件尽量只负责渲染与局部交互，远程数据获取优先封装在 hooks 中。
3. 运行时数据结构应来自 `src/schemas/`，本地交互态优先从 `src/stores/` 获取。

## 子模块文档

- [`Chat/README.md`](Chat/README.md)
- [`GenerativeUI/README.md`](GenerativeUI/README.md)
- [`Workflow/README.md`](Workflow/README.md)
