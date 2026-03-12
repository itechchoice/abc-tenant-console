# Workflow API

# 工作流管理 (Workflows)

## POST 创建工作流

POST /workflows

> Body 请求参数

```json
{
  "name": "Customer Support Router",
  "description": "Classify emails and route to handler",
  "definition": {
    "nodes": [
      {
        "id": "classify",
        "type": "MODEL",
        "config": {
          "modelId": "gpt-4o-mini",
          "prompt": "Classify intent: {{message}}. Return JSON: {\"intent\": \"billing|technical|general\"}",
          "temperature": 0.3,
          "maxTokens": 256
        },
        "position": {"x": 100, "y": 100, "z": 0}
      },
      {
        "id": "lookup",
        "type": "TOOL",
        "config": {
          "tool": "billing:query",
          "prompt": "Query billing info for the user",
          "conditionPrompt": "Only execute when {{classify.intent}} is billing"
        },
        "position": {"x": 400, "y": 100, "z": 0}
      },
      {
        "id": "reply",
        "type": "MODEL",
        "config": {
          "modelId": "gpt-4o",
          "prompt": "Write a reply based on: {{classify}} and {{lookup}}"
        },
        "position": {"x": 700, "y": 100, "z": 0}
      }
    ],
    "edges": [
      {"source": "classify", "target": "lookup"},
      {"source": "classify", "target": "reply"},
      {"source": "lookup", "target": "reply"}
    ]
  }
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 否 |租户ID，默认 tenant_default|
|body|body|object| 是 |none|
| name|body|string| 是 |工作流名称|
| description|body|string| 否 |描述信息|
| definition|body|[WorkflowDefinition](#schemaworkflowdefinition)| 是 |工作流定义（DAG 结构：nodes + edges）|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "wf_a1b2c3d4e5f6",
    "tenantId": "tenant_default",
    "name": "Customer Support Router",
    "description": "Classify emails and route to handler",
    "definition": { "..." : "..." },
    "version": 1,
    "status": "draft",
    "createdAt": "2026-03-10T10:00:00Z",
    "updatedAt": "2026-03-10T10:00:00Z"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|创建成功|Inline|

## GET 查询工作流列表

GET /workflows

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 否 |租户ID，默认 tenant_default|
|groupId|query|string| 否 |按分组ID过滤|
|status|query|string| 否 |按状态过滤：draft、published、deleted|
|name|query|string| 否 |按名称模糊搜索|
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
        "id": "wf_a1b2c3d4e5f6",
        "tenantId": "tenant_default",
        "name": "Customer Support Router",
        "description": "Classify emails and route to handler",
        "version": 1,
        "status": "draft",
        "createdAt": "2026-03-10T10:00:00Z",
        "updatedAt": "2026-03-10T10:00:00Z"
      }
    ],
    "total": 15,
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
| items|[WorkflowSummary]|true|none||工作流列表，按创建时间倒序|
| total|integer|true|none||符合条件的总数|
| page|integer|true|none||当前页码|
| size|integer|true|none||每页条数|

## GET 查询工作流详情

GET /workflows/{id}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |工作流ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "wf_a1b2c3d4e5f6",
    "tenantId": "tenant_default",
    "name": "Customer Support Router",
    "description": "Classify emails and route to handler",
    "definition": {
      "nodes": [ "..." ],
      "edges": [ "..." ]
    },
    "version": 1,
    "status": "draft",
    "tags": null,
    "createdBy": null,
    "createdAt": "2026-03-10T10:00:00Z",
    "updatedAt": "2026-03-10T10:00:00Z"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|工作流不存在|Inline|

## PUT 更新工作流

PUT /workflows/{id}

更新后 `version` 自动加 1。

> Body 请求参数

```json
{
  "name": "Customer Support Router v2",
  "description": "Updated description",
  "definition": { "..." : "..." }
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |工作流ID|
|body|body|object| 是 |none|
| name|body|string| 否 |工作流名称|
| description|body|string| 否 |描述信息|
| definition|body|[WorkflowDefinition](#schemaworkflowdefinition)| 否 |工作流定义，传则 version+1|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "wf_a1b2c3d4e5f6",
    "name": "Customer Support Router v2",
    "version": 2,
    "status": "draft",
    "updatedAt": "2026-03-10T12:00:00Z"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|更新成功|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|工作流不存在|Inline|

## DELETE 删除工作流

DELETE /workflows/{id}

软删除，将状态置为 deleted。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |工作流ID|

> 返回示例

> 200 Response

```json
{
  "code": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|删除成功|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|工作流不存在|Inline|

## POST 执行工作流

POST /workflows/{id}/run

内部创建一个 Task 来执行工作流，返回 taskId 和 sessionId。可通过 `GET /tasks/{taskId}/events` 订阅 SSE 获取节点级执行事件。

也可通过统一的 `POST /tasks` 接口执行（`capabilities` 传 `["workflow:<id>"]`）。

> Body 请求参数（可选）

```json
{}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |工作流ID|
|X-Tenant-Id|header|string| 否 |租户ID|
|body|body|object| 否 |可选的运行参数|

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
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|执行启动成功|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|工作流不存在|Inline|

### SSE 事件类型（通过 GET /tasks/{taskId}/events 获取）

|事件名|说明|payload 字段|
|---|---|---|
|STEP_START|节点开始执行|nodeId, nodeType|
|STEP_DONE (status=completed)|节点执行完成|nodeId, nodeType, status|
|STEP_DONE (status=skipped)|节点被执行守卫跳过|nodeId, nodeType, status, reason|
|STEP_DONE (status=failed)|节点执行失败|nodeId, nodeType, status, error|
|TASK_COMPLETED|工作流全部完成|-|
|TASK_FAILED|工作流执行失败|error message|

## GET 查询运行记录

GET /workflows/{id}/runs

返回该工作流的运行记录（以 Task 形式存储），按创建时间倒序。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |工作流ID|
|status|query|string| 否 |按任务状态过滤（COMPLETED / FAILED / RUNNING 等）|
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
        "workflowId": "wf_a1b2c3d4e5f6",
        "status": "COMPLETED",
        "intent": "San Francisco weather",
        "createdAt": "2026-03-10T10:00:00Z",
        "completedAt": "2026-03-10T10:00:15Z"
      },
      {
        "id": "task_abc124",
        "workflowId": "wf_a1b2c3d4e5f6",
        "status": "FAILED",
        "intent": "New York weather",
        "error": "Tool execution timeout",
        "createdAt": "2026-03-10T11:00:00Z",
        "completedAt": "2026-03-10T11:00:30Z"
      }
    ],
    "total": 120,
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
| items|[TaskSummary]|true|none||运行记录列表，按创建时间倒序|
| total|integer|true|none||符合条件的总数|
| page|integer|true|none||当前页码|
| size|integer|true|none||每页条数|

## GET 查询单次运行详情

GET /workflows/runs/{taskId}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|taskId|path|string| 是 |任务ID（运行记录的ID）|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "task_abc123",
    "tenantId": "tenant_default",
    "workflowId": "wf_a1b2c3d4e5f6",
    "sessionId": "session_abc123",
    "status": "COMPLETED",
    "intent": "San Francisco weather",
    "result": "{\"answer\": \"The weather in SF is...\"}",
    "createdAt": "2026-03-10T10:00:00Z",
    "completedAt": "2026-03-10T10:00:15Z"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|任务不存在|Inline|

---

# 工作流分组 (Workflow Groups)

工作流与分组是多对多关系，一个工作流可属于多个分组。

## POST 创建分组

POST /workflow-groups

> Body 请求参数

```json
{
  "name": "Customer Service",
  "description": "Customer service related workflows"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 否 |租户ID|
|body|body|object| 是 |none|
| name|body|string| 是 |分组名称（租户内唯一）|
| description|body|string| 否 |描述信息|
| sortOrder|body|integer| 否 |排序序号，默认 0|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "wfg_a1b2c3d4e5f6",
    "tenantId": "tenant_default",
    "name": "Customer Service",
    "description": "Customer service related workflows",
    "sortOrder": 0,
    "createdAt": "2026-03-10T10:00:00Z",
    "updatedAt": "2026-03-10T10:00:00Z"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|创建成功|Inline|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|名称已存在|Inline|

## GET 查询分组列表

GET /workflow-groups

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 否 |租户ID|
|name|query|string| 否 |按名称模糊搜索|
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
        "id": "wfg_a1b2c3d4e5f6",
        "tenantId": "tenant_default",
        "name": "Customer Service",
        "description": "Customer service related workflows",
        "sortOrder": 0,
        "createdAt": "2026-03-10T10:00:00Z",
        "updatedAt": "2026-03-10T10:00:00Z"
      }
    ],
    "total": 5,
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
| items|[WorkflowGroupEntity]|true|none||分组列表，按 sortOrder 排序|
| total|integer|true|none||符合条件的总数|
| page|integer|true|none||当前页码|
| size|integer|true|none||每页条数|

## GET 查询分组详情

GET /workflow-groups/{id}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |分组ID|

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|分组不存在|Inline|

## PUT 更新分组

PUT /workflow-groups/{id}

> Body 请求参数

```json
{
  "name": "Customer Service (Updated)",
  "description": "Updated description",
  "sortOrder": 1
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |分组ID|
|body|body|object| 是 |none|
| name|body|string| 否 |分组名称|
| description|body|string| 否 |描述|
| sortOrder|body|integer| 否 |排序序号|

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|更新成功|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|分组不存在|Inline|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|名称已存在|Inline|

## DELETE 删除分组

DELETE /workflow-groups/{id}

物理删除分组及其关联关系。不影响工作流本身。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |分组ID|

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|删除成功|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|分组不存在|Inline|

## POST 添加工作流到分组

POST /workflow-groups/{groupId}/workflows/{workflowId}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|groupId|path|string| 是 |分组ID|
|workflowId|path|string| 是 |工作流ID|

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|添加成功|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|分组或工作流不存在|Inline|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|工作流已在该分组中|Inline|

## DELETE 从分组移除工作流

DELETE /workflow-groups/{groupId}/workflows/{workflowId}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|groupId|path|string| 是 |分组ID|
|workflowId|path|string| 是 |工作流ID|

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|移除成功|Inline|

## GET 查询分组内的工作流

GET /workflow-groups/{groupId}/workflows

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|groupId|path|string| 是 |分组ID|
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
        "id": "wf_a1b2c3d4e5f6",
        "name": "Customer Support Router",
        "status": "draft",
        "version": 1,
        "createdAt": "2026-03-10T10:00:00Z"
      }
    ],
    "total": 8,
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
| items|[WorkflowSummary]|true|none||工作流列表|
| total|integer|true|none||符合条件的总数|
| page|integer|true|none||当前页码|
| size|integer|true|none||每页条数|

## GET 查询工作流所属分组

GET /workflow-groups/by-workflow/{workflowId}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|workflowId|path|string| 是 |工作流ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": [
    {
      "id": "wfg_a1b2c3d4e5f6",
      "name": "Customer Service",
      "sortOrder": 0
    },
    {
      "id": "wfg_x9y8z7w6v5u4",
      "name": "Email Automation",
      "sortOrder": 1
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

---

# 数据模型

## WorkflowDefinition

工作流定义，DAG 结构。

|名称|类型|必选|说明|
|---|---|---|---|
|nodes|[[WorkflowNode](#schemaworkflownode)]| 是 |节点列表|
|edges|[[Edge](#schemaedge)]| 否 |连线列表，定义节点间的连接关系（DAG）|

## Edge

|名称|类型|必选|说明|
|---|---|---|---|
|source|string| 是 |源节点ID|
|target|string| 是 |目标节点ID|

## WorkflowNode

|名称|类型|必选|说明|
|---|---|---|---|
|id|string| 是 |节点ID（工作流内唯一，不能用保留名 `message`）|
|type|string| 是 |节点类型：MODEL、TOOL、AGENT|
|config|object| 是 |节点配置，字段取决于 type（详见下方）|
|position|object| 否 |画布坐标 `{x, y, z}`，用于可视化编辑器|

### MODEL 节点 config

|名称|类型|必选|说明|
|---|---|---|---|
|prompt|string| 是 |LLM 指令，支持 `{{nodeId}}` 和 `{{nodeId.field}}` 变量模板|
|modelId|string| 否 |模型ID（如 gpt-4o），不传用默认|
|temperature|number| 否 |温度参数（0-2），默认 0.7|
|maxTokens|integer| 否 |最大生成 token 数，默认 2048|
|conditionPrompt|string| 否 |执行守卫条件（详见执行守卫章节）|

### TOOL 节点 config

|名称|类型|必选|说明|
|---|---|---|---|
|tool|string| 是 |工具标识，格式 `serverCode:toolName`（如 `billing:query`、`github:search_code`）|
|prompt|string| 否 |指导 LLM 如何构造调用参数和处理输出|
|conditionPrompt|string| 否 |执行守卫条件|

TOOL 节点的参数由 LLM 根据工具的 inputSchema、上游输出和 prompt 自动生成，无需手动指定参数。

### AGENT 节点 config

|名称|类型|必选|说明|
|---|---|---|---|
|agentId|string| 是 |智能体ID|
|prompt|string| 否 |传给 Agent 的消息，支持变量模板|
|conditionPrompt|string| 否 |执行守卫条件|

AGENT 节点内部创建子 Task，委托给 Agent 的完整 Compiler → Runtime 管线执行。

---

# 变量引用语法

|语法|含义|示例|
|---|---|---|
|`{{message}}`|当前用户消息（唯一系统变量）|`{{message}}`|
|`{{nodeId}}`|上游节点的完整输出|`{{classify}}`|
|`{{nodeId.field}}`|上游节点输出中的字段（支持多级路径）|`{{classify.intent}}`、`{{node1.data.user.name}}`|

解析规则：
- 含 `.`：按 `{{nodeId.fieldPath}}` 解析，从节点输出中提取字段
- 不含 `.`：先查节点输出，再查系统变量（`message`）
- 节点 ID 不能使用保留名 `message`

---

# 执行守卫 (Execution Guard)

每个节点可通过 `conditionPrompt` 字段控制是否执行。

### 工作原理

1. 有 `conditionPrompt` 的节点，执行前先进行一次独立的 LLM 调用
2. LLM 被锁定只能输出 `EXECUTE` 或 `SKIP`
3. 返回 `SKIP` 时节点被跳过，触发 `STEP_DONE (status=skipped)` SSE 事件
4. 返回 `EXECUTE` 时节点正常执行

### 跳过传播

被跳过节点的下游，如果**所有**上游都被跳过，也自动跳过。如果下游还有其他未被跳过的上游，则不受影响。

### 示例

```json
{
  "conditionPrompt": "Only execute when {{classify.intent}} is billing",
  "tool": "billing:query",
  "prompt": "Query billing info for the user"
}
```

`conditionPrompt` 只写条件，不写 fallback 指令。节点被跳过时不会执行任何逻辑。

---

# 执行模型

### DAG 拓扑执行

- 无入边的节点为入口节点，最先执行
- 多入边节点等待所有上游完成或跳过后才执行
- 同层无依赖的节点自动并行执行
- 必须是有向无环图，不允许循环

### 与 Task 的关系

工作流执行通过统一的 Task 生命周期管理：

- `POST /workflows/{id}/run` 内部创建 Task
- 也可通过 `POST /tasks` 的 `capabilities` 传 `["workflow:<id>"]` 触发
- Task 的 SSE 事件流推送每个节点的 STEP_START / STEP_DONE
- 支持取消（`POST /tasks/{taskId}/cancel`）

---

# 依赖检查

## GET 检查 MCP 依赖授权

GET /workflows/{id}/dependencies

提取工作流中所有 TOOL 节点依赖的 MCP Server，检查当前用户是否已授权。前端可在执行工作流前调用此接口，提示用户完成未授权的 MCP 连接。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |工作流ID|
|X-Tenant-Id|header|string| 否 |租户ID|
|X-User-Id|header|string| 否 |用户ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": [
    { "serverCode": "billing", "authorized": true },
    { "serverCode": "weather", "authorized": false }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|工作流不存在|Inline|

### 返回数据结构

|名称|类型|说明|
|---|---|---|
|serverCode|string|MCP Server 编码|
|authorized|boolean|当前用户是否已授权。`authType=NONE` 视为 true；有有效 connection 且状态 ACTIVE 视为 true；其他为 false|
