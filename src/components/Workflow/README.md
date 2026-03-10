# Workflow 模块说明

`src/components/Workflow/` 负责把后端任务执行过程转成可观察、可检查的工作流画布与时间线视图。

## 目录结构

- `WorkflowCanvas/`
  - 画布容器
  - 节点图数据构建
  - 执行头部、时间线、详情面板、空状态
- `nodes/`
  - 自定义 React Flow 节点类型

## 核心职责

1. 根据 `workflowRuntimeStore` 中的步骤和状态构建节点图。
2. 展示当前执行节点、执行顺序、工具调用和摘要结果。
3. 提供主工作台右侧可折叠、可拖拽宽度的执行观察面板。

## 数据来源

这个模块不直接请求后端，而是消费：

- `useWorkflowRuntimeStore`：实时执行状态
- `useChatStore`：会话级工作流上下文
- `workflowRuntimeSchema`：步骤、状态、摘要的统一类型定义

## 典型链路

1. `useAgentChat` 收到 SSE 事件
2. 事件写入 `workflowRuntimeStore`
3. `WorkflowCanvas` 读取 store 并构建图状态
4. `AgentNode`、时间线和详情面板同步更新

## 使用位置

该模块主要由 `src/pages/Home/index.tsx` 组合到右侧工作区中。
