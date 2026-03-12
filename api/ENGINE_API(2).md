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

创建会话并提交第一条消息（Agent 模式）：

```json
{
  "title": "销售数据分析",
  "agentId": "1892374650333333",
  "message": "帮我分析一下今天的销售数据"
}
```

创建会话并指定模型：

```json
{
  "title": "技术问题咨询",
  "modelId": "gpt-4o",
  "message": "帮我分析一下这个技术问题"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|integer(int64)| 否 |租户ID，默认 1|
|X-User-Id|header|integer(int64)| 否 |用户ID|
|body|body|object| 是 |none|
| title|body|string| 否 |会话标题，默认 "New Session"|
| agentId|body|string| 否 |智能体ID，传 message 时生效|
| modelId|body|string| 否 |模型ID，传 message 时生效（详见 `POST /tasks` 说明）|
| message|body|string| 否 |用户消息，传则同时创建任务|

> 返回示例

> 仅创建会话（未传 message）

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "sessionId": "1892374650111111",
    "taskId": null
  },
  "requestId": "a1b2c3d4e5f6"
}
```

> 创建会话并提交任务（传了 message）

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "sessionId": "1892374650111111",
    "taskId": "1892374650222222"
  },
  "requestId": "a1b2c3d4e5f6"
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
| message|string|true|none||响应消息|
| data|object|true|none||none|
| sessionId|string|true|none||会话ID|
| taskId|string\|null|true|none||任务ID，未传 message 时为 null|
| requestId|string|true|none||请求追踪ID|

## GET 查询会话列表

GET /sessions

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|integer(int64)| 否 |租户ID，默认 1|
|agentId|query|integer(int64)| 否 |按智能体ID过滤|
|userId|query|integer(int64)| 否 |按用户ID过滤|
|keyword|query|string| 否 |按标题关键词搜索|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "1892374650111111",
      "tenantId": "1001",
      "agentId": "1892374650333333",
      "userId": "1892374650123456",
      "title": "销售数据分析会话",
      "status": "active",
      "lastMessageAt": "2026-03-05T10:30:00Z",
      "createdAt": "2026-03-05T10:30:00Z",
      "updatedAt": "2026-03-05T10:30:00Z"
    },
    {
      "id": "1892374650111112",
      "tenantId": "1001",
      "agentId": "1892374650333333",
      "userId": "1892374650123456",
      "title": "技术问题咨询",
      "status": "active",
      "lastMessageAt": "2026-03-04T16:00:00Z",
      "createdAt": "2026-03-04T14:00:00Z",
      "updatedAt": "2026-03-04T16:00:00Z"
    }
  ],
  "requestId": "a1b2c3d4e5f6"
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
| message|string|true|none||响应消息|
| data|[[SessionEntity](#schemasessionentity)]|true|none||会话列表|
| requestId|string|true|none||请求追踪ID|

## GET 查询会话详情

GET /sessions/{id}

返回会话基本信息及历史消息。消息采用游标分页，默认返回最新一页（即最后 N 条），前端上滑时传 `before` 加载更早的消息。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|integer(int64)| 是 |会话ID|
|before|query|integer(int64)| 否 |游标：返回此消息ID之前的消息。不传则返回最新一页|
|limit|query|integer| 否 |每页条数，默认 20|

> 返回示例

> 首次加载（不传 before，返回最新消息）

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "1892374650111111",
    "tenantId": "1001",
    "userId": "1892374650123456",
    "title": "销售数据分析会话",
    "status": "active",
    "createdAt": "2026-03-05T10:30:00Z",
    "updatedAt": "2026-03-05T10:31:00Z",
    "messages": [
      {
        "id": "1892374650555003",
        "role": "user",
        "content": "和昨天对比一下呢？",
        "taskId": "1892374650222223",
        "taskStatus": "RUNNING",
        "createdAt": "2026-03-05T10:31:00Z"
      },
      {
        "id": "1892374650555004",
        "role": "assistant",
        "content": null,
        "taskId": "1892374650222223",
        "taskStatus": "RUNNING",
        "createdAt": "2026-03-05T10:31:01Z"
      }
    ],
    "hasMore": true
  },
  "requestId": "a1b2c3d4e5f6"
}
```

> 上滑加载更早消息（before=1892374650555003）

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "1892374650111111",
    "tenantId": "1001",
    "userId": "1892374650123456",
    "title": "销售数据分析会话",
    "status": "active",
    "createdAt": "2026-03-05T10:30:00Z",
    "updatedAt": "2026-03-05T10:31:00Z",
    "messages": [
      {
        "id": "1892374650555001",
        "role": "user",
        "content": "帮我分析一下今天的销售数据",
        "taskId": "1892374650222222",
        "taskStatus": "COMPLETED",
        "createdAt": "2026-03-05T10:30:00Z"
      },
      {
        "id": "1892374650555002",
        "role": "assistant",
        "content": "好的，今天的销售总额为 128,000 元，环比昨日上涨 12%...",
        "taskId": "1892374650222222",
        "taskStatus": "COMPLETED",
        "createdAt": "2026-03-05T10:30:05Z"
      }
    ],
    "hasMore": false
  },
  "requestId": "a1b2c3d4e5f6"
}
```

> 404 Response

```json
{
  "code": 404,
  "message": "Session not found: 1892374650999999",
  "data": null,
  "requestId": "a1b2c3d4e5f6"
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
| message|string|true|none||响应消息|
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
| requestId|string|true|none||请求追踪ID|

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
|taskStatus|COMPILING|
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
|id|path|integer(int64)| 是 |会话ID|
|body|body|object| 是 |none|
| title|body|string| 是 |新标题|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "1892374650111111",
    "tenantId": "1001",
    "agentId": "1892374650333333",
    "title": "新的会话标题",
    "status": "active",
    "updatedAt": "2026-03-05T12:00:00Z"
  },
  "requestId": "a1b2c3d4e5f6"
}
```

> 400 Response

```json
{
  "code": 400,
  "message": "Bad request: title is required",
  "data": null,
  "requestId": "a1b2c3d4e5f6"
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
| message|string|true|none||响应消息|
| data|[SessionEntity](#schemasessionentity)|true|none||更新后的会话|
| requestId|string|true|none||请求追踪ID|

## DELETE 删除会话

DELETE /sessions/{id}

软删除，将会话状态置为 deleted。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|integer(int64)| 是 |会话ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "success",
  "data": null,
  "requestId": "a1b2c3d4e5f6"
}
```

> 404 Response

```json
{
  "code": 404,
  "message": "Session not found: 1892374650999999",
  "data": null,
  "requestId": "a1b2c3d4e5f6"
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
| message|string|true|none||响应消息|
| data|object|true|none||无数据（null）|
| requestId|string|true|none||请求追踪ID|

# 任务管理 (Tasks)

## POST 创建任务

POST /tasks

两种模式：传 `agentId` 走 **Agent 模式**，不传走**普通模式**。`modelId` 和 `capabilities` 两个参数在两种模式下都可用。

| | Agent 模式 | 普通模式 |
|---|---|---|
| **modelId** | 覆盖 Agent 默认模型 | 指定模型（不传则自动路由） |
| **capabilities** | 与 Agent 自带工具合并 | 指定可用工具；可传 `workflow:<id>` 执行工作流；不传则纯聊天 |

`capabilities` 格式：`"*"` 所有可用能力（工具、工作流、skill 等） / `"github:*"` 某 Server 全部工具 / `"notion:search"` 具体工具 / `"code_review"` 技能 / `"workflow:1892374650444444"` 指定工作流。

> Body 请求参数

```json
// Agent 模式
{ "agentId": "1892374650333333", "message": "帮我分析一下今天的销售数据" }

// Agent 模式 + 覆盖模型 + 追加工具
{ "agentId": "1892374650333333", "modelId": "gpt-4o", "message": "查一下最近的 issue", "capabilities": ["github:*"] }

// 普通模式 — 执行工作流
{ "message": "帮我处理今天的客服邮件", "capabilities": ["workflow:1892374650444444"] }

// 普通模式 — 带工具聊天
{ "modelId": "gpt-4o", "message": "搜索一下产品文档", "capabilities": ["notion:search", "github:search_code"] }

// 普通模式 — 纯聊天
{ "message": "你好" }
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|integer(int64)| 否 |租户ID|
|X-User-Id|header|integer(int64)| 否 |用户ID|
|body|body|[CreateTaskRequest](#schemacreatetaskrequest)| 是 |none|
| agentId|body|string| 否 |智能体ID，传则走 Agent 模式|
| modelId|body|string| 否 |模型ID|
| sessionId|body|string| 否 |会话ID；不传时自动创建|
| message|body|string| 是 |用户消息|
| capabilities|body|string[]| 否 |能力范围（格式见上）|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "taskId": "1892374650222222",
    "sessionId": "1892374650111111"
  },
  "requestId": "a1b2c3d4e5f6"
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
| message|string|true|none||响应消息|
| data|object|true|none||none|
| taskId|string|true|none||新建任务ID|
| sessionId|string|true|none||关联会话ID|
| requestId|string|true|none||请求追踪ID|

## GET 任务列表

GET /tasks

查询任务列表，支持按会话、状态等条件过滤。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|integer(int64)| 否 |租户ID，默认 1|
|sessionId|query|string| 否 |按会话ID过滤|
|agentId|query|integer(int64)| 否 |按智能体ID过滤|
|workflowId|query|integer(int64)| 否 |按工作流ID过滤|
|status|query|string| 否 |按任务状态过滤（CREATED / COMPILING / RUNNING / COMPLETED / FAILED / SUSPENDED / CANCELLED）|
|page|query|integer| 否 |页码，默认 1|
|size|query|integer| 否 |每页条数，默认 20，最大 100|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "content": [
      {
        "id": "1892374650222222",
        "sessionId": "1892374650111111",
        "agentId": "1892374650333333",
        "modelId": "gpt-4o",
        "workflowId": null,
        "status": "COMPLETED",
        "intent": "分析销售数据",
        "createdAt": "2026-03-05T10:30:00Z",
        "completedAt": "2026-03-05T10:31:00Z"
      },
      {
        "id": "1892374650222223",
        "sessionId": "1892374650111111",
        "agentId": "1892374650333333",
        "modelId": "gpt-4o",
        "workflowId": null,
        "status": "RUNNING",
        "intent": "对比昨日数据",
        "createdAt": "2026-03-05T10:31:00Z",
        "completedAt": null
      }
    ],
    "totalElements": 42,
    "totalPages": 3,
    "size": 20,
    "number": 1,
    "first": true,
    "last": false,
    "empty": false
  },
  "requestId": "a1b2c3d4e5f6"
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
| message|string|true|none||响应消息|
| data|object|true|none||none|
| content|[TaskSummary]|true|none||任务摘要列表|
| totalElements|long|true|none||符合条件的总数|
| totalPages|integer|true|none||总页数|
| size|integer|true|none||每页条数|
| number|integer|true|none||当前页码（从1开始）|
| first|boolean|true|none||是否为第一页|
| last|boolean|true|none||是否为最后一页|
| empty|boolean|true|none||是否为空|
| requestId|string|true|none||请求追踪ID|

### TaskSummary

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| id|string|true|none||任务ID|
| sessionId|string|false|none||会话ID|
| agentId|string|false|none||智能体ID|
| modelId|string|false|none||模型ID|
| workflowId|string|false|none||工作流ID|
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
|id|path|integer(int64)| 是 |任务ID|

> 返回示例

> 200 Response（text/event-stream）

```
id: evt_001
event: STEP_START
data: {"eventId":"evt_001","type":"STEP_START","taskId":"1892374650222222","data":{...}}

id: evt_002
event: TOKEN_STREAM
data: {"eventId":"evt_002","type":"TOKEN_STREAM","taskId":"1892374650222222","data":{"content":"分析"}}

id: evt_003
event: TASK_COMPLETED
data: {"eventId":"evt_003","type":"TASK_COMPLETED","taskId":"1892374650222222","data":{...}}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|SSE 事件流|text/event-stream|

### 事件类型

|事件名|说明|
|---|---|
|TASK_CREATED|任务已创建|
|COMPILE_START|编排编译开始（Agent 模式）|
|COMPILE_DONE|编排编译完成（Agent 模式）|
|STEP_START|步骤开始执行|
|TOKEN_STREAM|LLM 输出文本片段|
|TOOL_CALL|工具调用|
|TOOL_RESULT|工具调用结果|
|STEP_DONE|步骤完成|
|TASK_COMPLETED|任务完成|
|TASK_FAILED|任务失败|
|TASK_CANCELLED|任务被取消|

## POST 取消任务

POST /tasks/{id}/cancel

取消一个处于 CREATED、RUNNING 或 SUSPENDED 状态的任务。已完成（COMPLETED）、已失败（FAILED）或已取消（CANCELLED）的任务不可再取消。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|integer(int64)| 是 |任务ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "taskId": "1892374650222222",
    "status": "CANCELLED"
  },
  "requestId": "a1b2c3d4e5f6"
}
```

> 400 Response

```json
{
  "code": 400,
  "message": "Task in COMPLETED state cannot be cancelled",
  "data": null,
  "requestId": "a1b2c3d4e5f6"
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
| message|string|true|none||响应消息|
| data|object|true|none||none|
| taskId|string|true|none||任务ID|
| status|string|true|none||取消后状态（CANCELLED）|
| requestId|string|true|none||请求追踪ID|

## POST 聊天流式接口（SSE）

POST /chat

等价于 `POST /tasks` + `GET /tasks/{id}/events` 的合并接口：创建任务并直接建立 SSE 事件流，省去两次调用。适用于实时对话场景。请求参数与 `POST /tasks` 完全相同（Agent / Workflow / Chat 三种执行方式）。未传 `sessionId` 时会先创建会话；传了 `sessionId` 时复用已有会话，不会新建会话。

> Body 请求参数

```json
{
  "agentId": "1892374650333333",
  "message": "你好，请介绍一下你自己",
  "capabilities": ["github:*"]
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|integer(int64)| 否 |租户ID，默认 1|
|X-User-Id|header|integer(int64)| 否 |用户ID|
|body|body|[CreateTaskRequest](#schemacreatetaskrequest)| 是 |参数说明同 `POST /tasks`|

> 返回示例

> 200 Response（text/event-stream）

```
event: INIT
data: {"taskId":"1892374650222222","sessionId":"1892374650111111"}

id: evt_001
event: STEP_START
data: {"eventId":"evt_001","type":"STEP_START","taskId":"1892374650222222",...}

id: evt_002
event: TOKEN_STREAM
data: {"eventId":"evt_002","type":"TOKEN_STREAM","taskId":"1892374650222222","data":{"content":"你好"}}

id: evt_003
event: TOKEN_STREAM
data: {"eventId":"evt_003","type":"TOKEN_STREAM","taskId":"1892374650222222","data":{"content":"，我是"}}

id: evt_004
event: TASK_COMPLETED
data: {"eventId":"evt_004","type":"TASK_COMPLETED","taskId":"1892374650222222",...}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|SSE 事件流，首条事件为 INIT|text/event-stream|

### SSE 事件说明

|事件名|说明|
|---|---|
|INIT|初始化事件，包含 taskId 和 sessionId|
|TASK_CREATED|任务已创建|
|COMPILE_START|编排编译开始（Agent 模式）|
|COMPILE_DONE|编排编译完成（Agent 模式）|
|STEP_START|步骤开始|
|TOKEN_STREAM|LLM 输出文本片段|
|TOOL_CALL|工具调用|
|TOOL_RESULT|工具调用结果|
|STEP_DONE|步骤完成|
|TASK_COMPLETED|任务完成|
|TASK_FAILED|任务失败|
|TASK_CANCELLED|任务被取消|
|error|序列化失败等内部错误|

# 指标统计 (Metrics)

## GET 获取指标汇总

GET /metrics/summary

注意：此接口直接返回数据对象，不使用 Result 包装。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|integer(int64)| 否 |租户ID，不传则查询全局|

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
|totalTasks|integer|true|none||任务总数|
|tasksCompleted|integer|true|none||已完成任务数|
|tasksFailed|integer|true|none||失败任务数|
|tasksRunning|integer|true|none||运行中任务数|
|activeAgents|integer|false|none||活跃智能体数（仅指定租户时返回）|
|totalWorkflowRuns|integer|true|none||工作流运行总数|

## GET 获取近期活动指标

GET /metrics/recent

注意：此接口直接返回数据对象，不使用 Result 包装。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|integer(int64)| 否 |租户ID，不传则查询全局|
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
|tasksLast{hours}h|integer|true|none||指定时间范围内的任务数|

## GET 获取任务数 Top 智能体

GET /metrics/top-agents

注意：此接口直接返回数组，不使用 Result 包装。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|integer(int64)| 否 |租户ID，不传则查询全局|
|limit|query|integer| 否 |返回数量上限，默认 10|

> 返回示例

> 200 Response

```json
[
  {
    "agentId": "1892374650333333",
    "taskCount": 350
  },
  {
    "agentId": "1892374650333334",
    "taskCount": 220
  },
  {
    "agentId": "1892374650333335",
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
|agentId|string|true|none||智能体ID|
|taskCount|integer|true|none||任务数量|
