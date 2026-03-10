# Chat 模块说明

`src/components/Chat/` 负责聊天主视图中的消息渲染主干，是“消息数组 -> 可视化消息列表”的最后一层。

## 当前结构

- `ChatMain/`
  - `index.tsx`：消息列表主组件。
  - `MessageRow.tsx`：单条消息外壳。
  - `ChatAvatar.tsx`：角色头像。
  - `TypingIndicator.tsx`：流式输出中的打字动画。
  - `messageResolvers.ts`：根据消息结构决定具体渲染类型。

## 职责边界

这个模块主要负责：

1. 将 `chatStore.messages` 渲染成时间顺序消息流。
2. 根据消息类型切换富文本、工具卡片、交互表单等具体表现。
3. 协调消息级动画、头像、状态展示等 UI 细节。

这个模块不负责：

- 发起网络请求
- 管理 SSE 连接
- 维护服务端缓存

这些职责分别由 `hooks/` 与 `stores/` 负责。

## 依赖关系

- 依赖 `src/stores/chatStore.ts` 获取消息与流式状态。
- 依赖 `src/components/GenerativeUI/` 渲染不同消息内容。
- 依赖 `src/schemas/chatSchema.ts` 中的消息类型定义。

## 使用场景

主要被 `src/pages/Home/components/ChatPanel/index.tsx` 使用，作为中心聊天区的消息渲染层。
