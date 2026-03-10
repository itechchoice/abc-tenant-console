# schemas 模块说明

`src/schemas/` 是整个项目的数据结构单一事实来源层，采用 **Zod schema + `z.infer` 类型导出** 的双层方案。

## 模块职责

1. 定义后端响应与前端运行时结构
2. 为 TypeScript 提供静态类型
3. 为运行时提供 `parse / safeParse` 校验能力

## 当前文件

- `chatSchema.ts`
  - 消息、工具调用、会话列表项等聊天核心结构
- `aiResponseSchemas.ts`
  - 交互表单 widgets、AI 返回 payload 等结构
- `modelSchema.ts`
  - 模型提供方与模型定义结构
- `workflowRuntimeSchema.ts`
  - 工作流步骤、状态、执行摘要结构

## 使用约定

- 能落到运行时的数据，优先先建 Zod schema
- 类型统一从 schema 中导出，例如 `export type Message = z.infer<typeof MessageSchema>`
- store / hooks / components 尽量不要手写重复的数据结构

## 为什么重要

这个模块直接决定了：

- 消息流是否安全进入 UI
- 工具调用卡片是否能稳定渲染
- React Query 返回的数据是否可被消费
- 工作流步骤是否能被正确映射到画布节点
