# stores 模块说明

`src/stores/` 使用 Zustand 管理高频、本地、实时 UI 状态。与 React Query 的“服务端缓存”不同，这里的 store 更偏向交互态和运行时态。

## 当前 store

- `authStore.ts`
  - 存放 token 和用户信息
  - 使用 `persist` 持久化登录态
- `chatStore.ts`
  - 存放当前消息列表、会话 id、聊天模式、模型选择、工具流状态
- `workflowRuntimeStore.ts`
  - 存放工作流步骤、阶段、当前节点、摘要、选中状态、回放状态

## 分工原则

适合进入 store 的状态：

- 当前选中的会话
- 当前消息数组
- 当前是否正在流式输出
- 当前工作流节点与步骤
- 面板 UI 交互状态

不适合进入 store 的状态：

- 普通服务端列表缓存
- 一次性查询结果
- 适合交给 React Query 管理的远程数据

## 关键配合关系

- `useAgentChat` 会持续写入 `chatStore` 和 `workflowRuntimeStore`
- 页面与共享组件从 store 读取实时状态并渲染
- `authStore` 会被 `apiClient` 直接读取以自动注入 token
