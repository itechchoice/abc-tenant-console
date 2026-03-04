---
description: 生成式 UI (Generative UI) 与动态交互组件的架构规范
globs: ["src/components/**/*Chat*.jsx", "src/components/GenerativeUI/**/*.jsx"]
---

# 生成式 UI 与工具调用拦截架构规范

## 核心架构决策 (Architecture Decision)

本项目由于未使用 React Server Components (RSC)，无法采用后端的流式 UI 方案。
针对 AI 返回的非纯文本内容（如工具调用、工作流画布预览、用户确认表单等），本项目的**唯一最佳实践**是：
**采用纯客户端的“组件注册表 (Component Registry) 与消息类型动态分发”机制。**

## 核心场景与渲染策略

基于后端的 SSE 事件规范，前端需要拦截并动态渲染以下两种核心非文本场景：

### 1. Tool Call (工具调用状态)
当大模型决定调用工具（如执行工作流节点、查询数据）时：
- **拦截机制**：Store 接收到 `tool_call` 事件后，在 `messages` 数组中插入一条 `type: 'tool_call'` 的消息。
- **UI 呈现**：在消息列表中，不允许渲染生硬的 JSON 参数。必须根据 `toolName` 映射到对应的 React 骨架屏或状态卡片（例如：显示“🔄 正在执行数据清洗工作流...”及微型进度条）。
- **完成替换**：收到 `tool_result` 后，更新该卡片的状态为成功或失败，并展示精简的执行摘要。

### 2. Client Interaction (客户端交互打断)
当大模型需要用户提供信息或做选择时，SSE 连接会被后端主动中断，并下发结构化的表单组件数据（如按钮组、输入框等）：
- **拦截机制**：Store 接收到 `client_interaction` 事件，向 `messages` 数组推入一条 `type: 'interaction'` 的交互消息。
- **UI 呈现**：动态渲染 `DynamicInteractionForm` 组件。该组件需根据下发的 `widgets` 数组（如 `button_group`, `input`），动态组装纯 JSX 表单。
- **提交流程**：用户在动态表单中点击提交后，前端通过 Zustand Store 的方法重新发起请求，将用户的输入作为 `toolResults` 回传给后端，从而恢复对话流。

## 代码实现规范与约束

### 组件分发器 (Message Dispatcher) 示例
在 `ChatMain.jsx` 的消息列表渲染中，必须严格按照 `msg.type` 进行路由分发，严禁将所有逻辑揉杂在一个巨型组件中：

```jsx
// src/components/ChatMain/MessageList.jsx
import MarkdownMessage from './MarkdownMessage';
import ToolCallCard from '../GenerativeUI/ToolCallCard';
import InteractionForm from '../GenerativeUI/InteractionForm';

export default function MessageList({ messages }) {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((msg) => {
        // 1. 渲染标准 Markdown 文本
        if (msg.type === 'text') {
          return <MarkdownMessage key={msg.id} content={msg.content} />;
        }
        
        // 2. 渲染工具调用过程卡片 (Generative UI)
        if (msg.type === 'tool_call') {
          return <ToolCallCard key={msg.id} toolName={msg.toolName} args={msg.args} status={msg.status} />;
        }
        
        // 3. 渲染用户交互表单 (打断与恢复)
        if (msg.type === 'interaction') {
          return <InteractionForm key={msg.id} interactionData={msg.interaction} toolCallId={msg.toolCallId} />;
        }
        
        return null; // 兜底容错
      })}
    </div>
  );
}

```

## AI Agent 行为准则

当用户要求“渲染工具面板”、“实现对话框里的表单”、“处理用户交互”时，AI Agent 必须：

1. **遵循分发模式**：所有的动态 UI 必须作为一个独立组件存放在 `src/components/GenerativeUI/` 目录下，并在 `MessageList` 中通过 `type` 进行分发引入。
2. **拒绝 RSC**：绝对不要尝试使用或引入 `React Server Components` 的相关代码或 Vercel 的 `@vercel/ui` 预设包。
3. **数据安全防线**：在 `InteractionForm` 或复杂的 `ToolCallCard` 组件内部，接收到的 `args` 或 `widgets` 属性，必须通过 `zod` 进行运行时结构校验，防止后端/大模型下发的数据残缺导致白屏报错。