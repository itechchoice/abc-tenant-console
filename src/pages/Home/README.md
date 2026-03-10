# Home 页面模块说明

`src/pages/Home/` 是整个控制台的主工作台页面，也是项目最核心的页面模块。

## 页面结构

`Home` 页面采用三栏布局：

1. 左侧：`ConversationSidebar`
2. 中间：`ChatPanel`
3. 右侧：`WorkflowCanvas`

其中右侧工作流面板支持：

- 自动展开
- 手动显隐
- 拖拽调整宽度
- 本地缓存宽度

## 页面内组件

### `components/ConversationSidebar/`

负责：

- 查询并展示历史会话列表
- 搜索会话
- 删除会话
- 切换新建对话 / 历史会话

### `components/ChatPanel/`

负责：

- 历史会话详情回填
- 运行中任务重连
- 聊天发送与停止
- 欢迎态、骨架屏、聊天主视图切换

### `components/WorkflowSplitter.tsx`

负责右侧工作流面板和中间聊天区之间的拖拽分隔。

### `components/ModelSelector.tsx`

负责展示可用模型列表并切换当前模型。

### `components/AgentSelector.tsx`

负责展示 Agent 选择入口。当前目录中的实现仍以本地 mock 数据为主，后续可以接入真实查询接口。

## 协调关系

`Home/index.tsx` 本身不直接处理底层 SSE，而是通过：

- `ChatPanel` 触发消息发送
- `ConversationSidebar` 切换历史会话
- `WorkflowCanvas` 消费 workflow runtime store

它更像是主工作台的“编排层”。
