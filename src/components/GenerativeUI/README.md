# GenerativeUI 模块说明

`src/components/GenerativeUI/` 用来承接 AI 输出的“生成式界面”。这里的组件不是固定表单页，而是根据消息内容和事件类型动态决定展示方式。

## 当前子模块

- `MarkdownMessage/`
  - 负责 Markdown、GFM、代码块高亮等富文本内容展示。
- `ToolCallCard/`
  - 负责展示工具调用名称、状态、输入参数和结果 payload。
- `InteractionForm/`
  - 负责渲染后端发来的 `client_interaction` 动态表单。

## 模块价值

这个模块把“消息内容渲染”和“消息来源结构”解耦开了：

1. 上层只需要给出消息对象或交互 metadata。
2. 该模块内部再决定用 Markdown、工具卡片还是动态表单。

这样做的好处是：

- 聊天主链路更清晰。
- 新增消息类型时，影响范围集中。
- 更适合承接 AI Agent 的多态输出。

## 依赖关系

- `MarkdownMessage` 依赖 `react-markdown`、`remark-gfm`、`react-syntax-highlighter`
- `ToolCallCard` 依赖 `chatSchema` 中的工具调用结构
- `InteractionForm` 依赖 `aiResponseSchemas` 中的 widget / payload 定义

## 使用方式

通常不直接在页面层使用，而是由 `src/components/Chat/ChatMain/` 通过消息解析器按需调用。
