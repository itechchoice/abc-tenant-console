# ABC Engine API

# 会话管理 (Sessions)

## POST 创建会话

POST /sessions

创建会话。可选同时提交第一条消息来创建任务，省去额外调用 `POST /tasks`。

> Body 请求参数

仅创建会话：

```json
{
  "title": "销售数据分析"
}
```

创建会话并提交第一条消息：

```json
{
  "title": "销售数据分析",
  "agentId": "agent_abc123",
  "message": "帮我分析一下今天的销售数据"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 否 |租户ID，默认 tenant_default|
|X-User-Id|header|string| 否 |用户ID|
|body|body|object| 是 |none|
| title|body|string| 否 |会话标题，默认 "New Session"|
| agentId|body|string| 否 |智能体ID，传 message 时生效|
| modelId|body|string| 否 |模型ID，传 message 且无 agentId 时生效|
| message|body|string| 否 |用户消息，传则同时创建任务|

> 返回示例

> 仅创建会话（未传 message）

```json
{
  "code": 0,
  "data": {
    "sessionId": "session_abc123",
    "taskId": null
  }
}
```

> 创建会话并提交任务（传了 message）

```json
{
  "code": 0,
  "data": {
    "sessionId": "session_abc123",
    "taskId": "task_abc123"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|创建成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|object|true|none||none|
| sessionId|string|true|none||会话ID|
| taskId|string\|null|true|none||任务ID，未传 message 时为 null|

## GET 查询会话列表

GET /sessions

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 否 |租户ID，默认 tenant_default|
|agentId|query|string| 否 |按智能体ID过滤|
|userId|query|string| 否 |按用户ID过滤|
|keyword|query|string| 否 |按标题关键词搜索|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": [
    {
      "id": "session_abc123",
      "tenantId": "tenant_abc123",
      "agentId": "agent_abc123",
      "userId": "user_abc123",
      "title": "销售数据分析会话",
      "status": "active",
      "lastMessageAt": "2026-03-05T10:30:00Z",
      "createdAt": "2026-03-05T10:30:00Z",
      "updatedAt": "2026-03-05T10:30:00Z"
    },
    {
      "id": "session_def456",
      "tenantId": "tenant_abc123",
      "agentId": "agent_abc123",
      "userId": "user_abc123",
      "title": "技术问题咨询",
      "status": "active",
      "lastMessageAt": "2026-03-04T16:00:00Z",
      "createdAt": "2026-03-04T14:00:00Z",
      "updatedAt": "2026-03-04T16:00:00Z"
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[[SessionEntity](#schemasessionentity)]|true|none||会话列表，按最后消息时间倒序|

## GET 查询会话详情

GET /sessions/{id}

返回会话基本信息及历史消息。消息采用游标分页，默认返回最新一页（即最后 N 条），前端上滑时传 `before` 加载更早的消息。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |会话ID|
|before|query|string| 否 |游标：返回此消息ID之前的消息。不传则返回最新一页|
|limit|query|integer| 否 |每页条数，默认 20，最大 100|

> 返回示例

> 首次加载（不传 before，返回最新消息）

```json
{
  "code": 0,
  "data": {
    "id": "session_abc123",
    "tenantId": "tenant_abc123",
    "userId": "user_abc123",
    "title": "销售数据分析会话",
    "status": "active",
    "createdAt": "2026-03-05T10:30:00Z",
    "updatedAt": "2026-03-05T10:31:00Z",
    "messages": [
      {
        "id": "msg_003",
        "role": "user",
        "content": "和昨天对比一下呢？",
        "taskId": "task_abc124",
        "taskStatus": "RUNNING",
        "createdAt": "2026-03-05T10:31:00Z"
      },
      {
        "id": "msg_004",
        "role": "assistant",
        "content": null,
        "taskId": "task_abc124",
        "taskStatus": "RUNNING",
        "createdAt": "2026-03-05T10:31:01Z"
      }
    ],
    "hasMore": true
  }
}
```

> 上滑加载更早消息（before=msg_003）

```json
{
  "code": 0,
  "data": {
    "id": "session_abc123",
    "tenantId": "tenant_abc123",
    "userId": "user_abc123",
    "title": "销售数据分析会话",
    "status": "active",
    "createdAt": "2026-03-05T10:30:00Z",
    "updatedAt": "2026-03-05T10:31:00Z",
    "messages": [
      {
        "id": "msg_001",
        "role": "user",
        "content": "帮我分析一下今天的销售数据",
        "taskId": "task_abc123",
        "taskStatus": "COMPLETED",
        "createdAt": "2026-03-05T10:30:00Z"
      },
      {
        "id": "msg_002",
        "role": "assistant",
        "content": "好的，今天的销售总额为 128,000 元，环比昨日上涨 12%...",
        "taskId": "task_abc123",
        "taskStatus": "COMPLETED",
        "createdAt": "2026-03-05T10:30:05Z"
      }
    ],
    "hasMore": false
  }
}
```

> 404 Response

```json
{
  "code": 404,
  "message": "Session not found: session_notexist"
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|会话不存在|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|object|true|none||会话信息（含分页消息）|
| id|string|true|none||会话ID|
| tenantId|string|true|none||租户ID|
| userId|string|false|none||用户ID|
| title|string|true|none||会话标题|
| status|string|true|none||会话状态|
| createdAt|string(date-time)|true|none||创建时间|
| updatedAt|string(date-time)|true|none||更新时间|
| messages|[MessageRecord]|true|none||消息列表，按时间正序|
| hasMore|boolean|true|none||是否还有更早的消息，false 表示已到顶|

### MessageRecord

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| id|string|true|none||消息ID|
| role|string|true|none||角色：user / assistant|
| content|string\|null|true|none||消息内容，任务未完成时 assistant 消息为 null|
| taskId|string|true|none||关联任务ID，同一轮对话的 user 和 assistant 消息共享相同 taskId|
| taskStatus|string|true|none||任务状态，同一轮 user 和 assistant 消息值相同|
| createdAt|string(date-time)|true|none||消息时间|

#### 枚举值

|属性|值|
|---|---|
|role|user|
|role|assistant|
|taskStatus|CREATED|
|taskStatus|RUNNING|
|taskStatus|COMPLETED|
|taskStatus|FAILED|
|taskStatus|SUSPENDED|

## PUT 重命名会话

PUT /sessions/{id}

> Body 请求参数

```json
{
  "title": "新的会话标题"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |会话ID|
|body|body|object| 是 |none|
| title|body|string| 是 |新标题|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "session_abc123",
    "tenantId": "tenant_abc123",
    "agentId": "agent_abc123",
    "title": "新的会话标题",
    "status": "active",
    "updatedAt": "2026-03-05T12:00:00Z"
  }
}
```

> 400 Response

```json
{
  "code": 400,
  "message": "title is required"
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|重命名成功|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|参数缺失|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|会话不存在|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[SessionEntity](#schemasessionentity)|true|none||更新后的会话|

## DELETE 删除会话

DELETE /sessions/{id}

软删除，将会话状态置为 deleted。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |会话ID|

> 返回示例

> 200 Response

```json
{
  "code": 0
}
```

> 404 Response

```json
{
  "code": 404,
  "message": "Session not found: session_notexist"
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|删除成功|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|会话不存在|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|

# 任务管理 (Tasks)

## POST 创建任务

POST /tasks

支持三种执行模式：

| 模式 | 条件 | 行为 |
|------|------|------|
| **Agent** | 传 `agentId` | 完整编排流程（Compiler → Runtime），支持工具调用 |
| **模型直连** | 传 `modelId`，不传 `agentId` | 跳过编排，直接调用 LLM Gateway 聊天 |
| **Auto** | 两个都不传 | LLM Gateway 路由规则自动选择模型池 |

> Body 请求参数

Agent 模式：

```json
{
  "agentId": "agent_abc123",
  "sessionId": "session_abc123",
  "message": "帮我分析一下今天的销售数据"
}
```

模型直连模式：

```json
{
  "modelId": "gpt-4o",
  "sessionId": "session_abc123",
  "message": "1+1等于几？"
}
```

Auto 模式：

```json
{
  "sessionId": "session_abc123",
  "message": "你好，请介绍一下你自己"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 是 |租户ID|
|body|body|[CreateTaskRequest](#schemacreatetaskrequest)| 是 |none|
| agentId|body|string| 否 |智能体ID，传则走 Agent 模式|
| modelId|body|string| 否 |模型ID，agentId 为空时生效（模型直连模式）；两者都不传则走 Auto 模式|
| sessionId|body|string| 是 |会话ID|
| message|body|string| 是 |用户消息|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "taskId": "task_abc123",
    "sessionId": "session_abc123"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|任务创建成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|object|true|none||none|
| taskId|string|true|none||新建任务ID|
| sessionId|string|true|none||关联会话ID|

## GET 任务列表

GET /tasks

查询任务列表，支持按会话、状态等条件过滤。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 否 |租户ID，默认 tenant_default|
|sessionId|query|string| 否 |按会话ID过滤|
|agentId|query|string| 否 |按智能体ID过滤|
|status|query|string| 否 |按任务状态过滤（CREATED / RUNNING / COMPLETED / FAILED / SUSPENDED / CANCELLED）|
|page|query|integer| 否 |页码，默认 1|
|size|query|integer| 否 |每页条数，默认 20，最大 100|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": "task_abc123",
        "sessionId": "session_abc123",
        "agentId": "agent_abc123",
        "status": "COMPLETED",
        "intent": "分析销售数据",
        "createdAt": "2026-03-05T10:30:00Z",
        "completedAt": "2026-03-05T10:31:00Z"
      },
      {
        "id": "task_abc124",
        "sessionId": "session_abc123",
        "agentId": "agent_abc123",
        "status": "RUNNING",
        "intent": "对比昨日数据",
        "createdAt": "2026-03-05T10:31:00Z",
        "completedAt": null
      }
    ],
    "total": 42,
    "page": 1,
    "size": 20
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|object|true|none||none|
| items|[TaskSummary]|true|none||任务摘要列表|
| total|integer|true|none||符合条件的总数|
| page|integer|true|none||当前页码|
| size|integer|true|none||每页条数|

### TaskSummary

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| id|string|true|none||任务ID|
| sessionId|string|false|none||会话ID|
| agentId|string|false|none||智能体ID|
| modelId|string|false|none||模型ID|
| status|string|true|none||任务状态|
| intent|string|false|none||意图摘要|
| createdAt|string(date-time)|true|none||创建时间|
| completedAt|string(date-time)|false|none||完成时间|

## GET 任务事件流（SSE）

GET /tasks/{id}/events

实时推送任务执行事件的 Server-Sent Events 流。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |任务ID|

> 返回示例

> 200 Response（text/event-stream）

```
id: evt_001
event: STEP_START
data: {"eventId":"evt_001","type":"STEP_START","taskId":"task_abc123","data":{...}}

id: evt_002
event: LLM_CHUNK
data: {"eventId":"evt_002","type":"LLM_CHUNK","taskId":"task_abc123","data":{"text":"分析"}}

id: evt_003
event: TASK_COMPLETE
data: {"eventId":"evt_003","type":"TASK_COMPLETE","taskId":"task_abc123","data":{...}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|SSE 事件流|text/event-stream|

### 事件类型

|事件名|说明|
|---|---|
|STEP_START|步骤开始执行|
|LLM_CHUNK|LLM 输出文本片段|
|TOOL_CALL|工具调用|
|TOOL_RESULT|工具调用结果|
|STEP_COMPLETE|步骤完成|
|TASK_COMPLETE|任务完成|
|TASK_FAILED|任务失败|
|TASK_SUSPENDED|任务暂停（等待审批/人工输入）|
|TASK_CANCELLED|任务被取消|

## POST 取消任务

POST /tasks/{id}/cancel

取消一个处于 CREATED、RUNNING 或 SUSPENDED 状态的任务。已完成（COMPLETED）、已失败（FAILED）或已取消（CANCELLED）的任务不可再取消。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |任务ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "taskId": "task_abc123",
    "status": "CANCELLED"
  }
}
```

> 400 Response

```json
{
  "code": 400,
  "message": "Task in COMPLETED state cannot be cancelled"
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|取消成功|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|任务状态不允许取消|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|任务不存在|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|object|true|none||none|
| taskId|string|true|none||任务ID|
| status|string|true|none||取消后状态（CANCELLED）|

## POST 聊天流式接口（SSE）

POST /chat

等价于 `POST /tasks` + `GET /tasks/{id}/events` 的合并接口：创建任务并直接建立 SSE 事件流，省去两次调用。适用于实时对话场景。支持与 `/tasks` 相同的三种模式。

> Body 请求参数

Agent 模式：

```json
{
  "agentId": "agent_abc123",
  "sessionId": "session_abc123",
  "message": "你好，请介绍一下你自己"
}
```

模型直连模式：

```json
{
  "modelId": "gpt-4o",
  "sessionId": "session_abc123",
  "message": "你好，请介绍一下你自己"
}
```

Auto 模式：

```json
{
  "sessionId": "session_abc123",
  "message": "你好，请介绍一下你自己"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 否 |租户ID，默认 tenant_default|
|X-User-Id|header|string| 否 |用户ID|
|body|body|[CreateTaskRequest](#schemacreatetaskrequest)| 是 |none|
| agentId|body|string| 否 |智能体ID，传则走 Agent 模式|
| modelId|body|string| 否 |模型ID，agentId 为空时生效（模型直连模式）；两者都不传则走 Auto 模式|
| sessionId|body|string| 是 |会话ID|
| message|body|string| 是 |用户消息|

> 返回示例

> 200 Response（text/event-stream）

```
event: INIT
data: {"taskId":"task_abc123","sessionId":"session_abc123"}

id: evt_001
event: STEP_START
data: {"eventId":"evt_001","type":"STEP_START","taskId":"task_abc123",...}

id: evt_002
event: LLM_CHUNK
data: {"eventId":"evt_002","type":"LLM_CHUNK","taskId":"task_abc123","data":{"text":"你好"}}

id: evt_003
event: LLM_CHUNK
data: {"eventId":"evt_003","type":"LLM_CHUNK","taskId":"task_abc123","data":{"text":"，我是"}}

id: evt_004
event: TASK_COMPLETE
data: {"eventId":"evt_004","type":"TASK_COMPLETE","taskId":"task_abc123",...}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|SSE 事件流，首条事件为 INIT|text/event-stream|

### SSE 事件说明

|事件名|说明|
|---|---|
|INIT|初始化事件，包含 taskId 和 sessionId|
|STEP_START|步骤开始|
|LLM_CHUNK|LLM 输出文本片段|
|TOOL_CALL|工具调用|
|TOOL_RESULT|工具调用结果|
|STEP_COMPLETE|步骤完成|
|TASK_COMPLETE|任务完成|
|TASK_FAILED|任务失败|
|TASK_CANCELLED|任务被取消|
|error|序列化失败等内部错误|

# 指标统计 (Metrics)

## GET 获取指标汇总

GET /metrics/summary

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 否 |租户ID，不传则查询全局|

> 返回示例

> 200 Response

```json
{
  "totalTasks": 1250,
  "tasksCompleted": 1100,
  "tasksFailed": 50,
  "tasksRunning": 5,
  "activeAgents": 12,
  "totalWorkflowRuns": 320
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| totalTasks|integer|true|none||任务总数|
| tasksCompleted|integer|true|none||已完成任务数|
| tasksFailed|integer|true|none||失败任务数|
| tasksRunning|integer|true|none||运行中任务数|
| activeAgents|integer|false|none||活跃智能体数（仅指定租户时返回）|
| totalWorkflowRuns|integer|true|none||工作流运行总数|

## GET 获取近期活动指标

GET /metrics/recent

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 否 |租户ID，不传则查询全局|
|hours|query|integer| 否 |回溯小时数，默认 24|

> 返回示例

> 200 Response

```json
{
  "tasksLast24h": 85
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| tasksLast{hours}h|integer|true|none||指定时间范围内的任务数|

## GET 获取任务数 Top 智能体

GET /metrics/top-agents

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 否 |租户ID，不传则查询全局|
|limit|query|integer| 否 |返回数量上限，默认 10|

> 返回示例

> 200 Response

```json
[
  {
    "agentId": "agent_abc123",
    "taskCount": 350
  },
  {
    "agentId": "agent_def456",
    "taskCount": 220
  },
  {
    "agentId": "agent_ghi789",
    "taskCount": 150
  }
]
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| agentId|string|true|none||智能体ID|
| taskCount|integer|true|none||任务数量|
