# hooks 模块说明

`src/hooks/` 封装了项目中的共享 React hooks，主要覆盖三类能力：

1. 页面行为类 hook
2. 服务端查询 / mutation hook
3. 聊天与流式任务连接 hook

## 文件说明

- `useDocumentTitle.ts`
  - 根据当前路由 `handle.title` 同步浏览器标题。
- `useLogin.ts`
  - 封装登录 mutation，并在成功后写入 `authStore`。
- `useModels.ts`
  - 查询可用模型列表，并在首次返回时默认选中第一项。
- `useChatHistory.ts`
  - 查询会话列表与会话详情，维护 React Query 的 query key。
- `useAgentChat.ts`
  - 项目核心 hook，负责发送消息、连接 SSE、处理任务流和消息流。

## 设计约定

- 远程读取优先封装为 `useQuery`
- 写操作优先封装为 `useMutation`
- 与聊天实时性强耦合的逻辑集中在 `useAgentChat`

## 特别说明

`useAgentChat.ts` 是项目最复杂的 hook，负责：

- `POST /chat`
- `POST /tasks`
- `GET /tasks/{id}/events`
- `INIT / TOKEN_STREAM / TOOL_CALL / TASK_* / client_interaction` 事件路由

它会同时驱动：

- `chatStore`
- `workflowRuntimeStore`

因此修改该文件时，要同时关注消息渲染链路和工作流可视化链路。
