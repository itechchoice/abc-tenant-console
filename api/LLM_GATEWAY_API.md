# ABC LLM Gateway API

## POST 聊天补全（SSE 流式）

POST /models/chat/completions

兼容 OpenAI 格式的聊天补全接口，默认以 SSE 流式返回。

> Body 请求参数

```json
{
  "agentId": "agent_abc123",
  "sessionId": "sess_xyz",
  "model": "gpt-4o",
  "messages": [
    {"role": "system", "content": "你是一个有用的助手"},
    {"role": "user", "content": "你好，请介绍一下你自己"}
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "search_web",
        "description": "Search the web for information",
        "parameters": {
          "type": "object",
          "properties": {
            "query": {"type": "string"}
          },
          "required": ["query"]
        }
      }
    }
  ],
  "stream": true,
  "temperature": 0.7,
  "maxTokens": 4096
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 否 |租户ID|
|X-User-Id|header|string| 否 |用户ID|
|body|body|[ChatRequest](#schemachatrequest)| 是 |none|
| agentId|body|string| 否 |目标智能体ID（平台路由用）|
| sessionId|body|string| 否 |会话ID，用于上下文连续性|
| model|body|string| 否 |模型ID覆盖，如 gpt-4o|
| messages|body|[[ChatMessage](#schemachatmessage)]| 是 |对话消息历史|
| tools|body|[[ToolDefinition](#schematooldefinition)]| 否 |可用工具定义|
| stream|body|boolean| 否 |是否启用 SSE 流式输出，默认 true|
| temperature|body|number(double)| 否 |采样温度|
| maxTokens|body|integer| 否 |最大输出 token 数|

> 返回示例

> 200 Response（text/event-stream，stream=true 时）

```
data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"delta":{"role":"assistant","content":"你好"},"index":0}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"delta":{"content":"，我是"},"index":0}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"delta":{"content":"一个AI助手。"},"index":0,"finish_reason":"stop"}]}

data: [DONE]
```

> 429 Response

```json
{
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded: 60 requests per minute"
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|SSE 流式返回（stream=true）或单次返回|text/event-stream|
|429|[Too Many Requests](https://tools.ietf.org/html/rfc6585#section-4)|速率限制|Inline|

## POST 聊天补全（同步）

POST /models/chat/sync

同步聊天补全，返回完整响应。

> Body 请求参数

```json
{
  "model": "gpt-4o",
  "messages": [
    {"role": "user", "content": "1+1等于几？"}
  ],
  "stream": false,
  "temperature": 0.0
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 否 |租户ID|
|X-User-Id|header|string| 否 |用户ID|
|body|body|[ChatRequest](#schemachatrequest)| 是 |none|

> 返回示例

> 200 Response

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "1+1等于2。"
      }
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
| choices|[object]|true|none||选项列表|
| message|object|true|none||消息|
| role|string|true|none||角色，固定为 assistant|
| content|string|true|none||回复内容|

## POST 生成向量嵌入

POST /models/embeddings

将文本转换为向量嵌入。

> Body 请求参数

```json
{
  "input": "这是一段需要嵌入的文本",
  "model": "text-embedding-3-small"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 否 |租户ID|
|X-User-Id|header|string| 否 |用户ID|
|body|body|object| 是 |none|
| input|body|string| 是 |待嵌入的文本|
| model|body|string| 是 |嵌入模型ID|

> 返回示例

> 200 Response

```json
{
  "embedding": [0.0023064255, -0.009327292, 0.015797347, -0.0077816248, 0.012296906]
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
| embedding|[number(double)]|true|none||向量嵌入数组|

# LLM 提供商管理 (Providers)

## GET 列出活跃提供商

GET /models/providers

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": [
    {
      "id": "prov_001",
      "tenantId": "system",
      "name": "OpenAI",
      "type": "openai",
      "baseUrl": "https://api.openai.com/v1",
      "config": "{\"orgId\":\"org-xxx\"}",
      "status": "active",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    },
    {
      "id": "prov_002",
      "tenantId": "system",
      "name": "Anthropic",
      "type": "anthropic",
      "baseUrl": "https://api.anthropic.com",
      "status": "active",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
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
| data|[[ProviderEntity](#schemaproviderentity)]|true|none||提供商列表（仅活跃状态）|
| id|string|true|none||提供商ID|
| tenantId|string|true|none||租户ID|
| name|string|true|none||提供商名称|
| type|string|true|none||提供商类型|
| baseUrl|string|false|none||API 基础 URL|
| config|string(json)|false|none||附加配置（JSON）|
| status|string|true|none||状态|
| createdAt|string(date-time)|true|none||创建时间|
| updatedAt|string(date-time)|true|none||更新时间|

#### 枚举值

|属性|值|
|---|---|
|type|openai|
|type|anthropic|
|type|azure|
|type|custom|
|status|active|
|status|deleted|

## GET 按 ID 查询提供商

GET /models/providers/{id}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |提供商ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "prov_001",
    "tenantId": "system",
    "name": "OpenAI",
    "type": "openai",
    "baseUrl": "https://api.openai.com/v1",
    "config": "{\"orgId\":\"org-xxx\"}",
    "status": "active",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z"
  }
}
```

> 404 Response

```json
{
  "code": 40400,
  "message": "Provider not found"
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|提供商不存在|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[ProviderEntity](#schemaproviderentity)|true|none||提供商信息|

## POST 创建 LLM 提供商

POST /models/providers

> Body 请求参数

```json
{
  "name": "OpenAI",
  "type": "openai",
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-xxx",
  "config": "{\"orgId\":\"org-xxx\"}"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 否 |租户ID，默认 system|
|body|body|[ProviderEntity](#schemaproviderentity)| 是 |none|
| name|body|string| 是 |提供商名称|
| type|body|string| 是 |提供商类型（openai / anthropic / azure / custom）|
| baseUrl|body|string| 否 |API 基础 URL|
| apiKey|body|string| 否 |API Key（加密存储）|
| config|body|string(json)| 否 |附加配置|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "prov_new001",
    "tenantId": "system",
    "name": "OpenAI",
    "type": "openai",
    "baseUrl": "https://api.openai.com/v1",
    "status": "active",
    "createdAt": "2026-03-05T10:30:00Z",
    "updatedAt": "2026-03-05T10:30:00Z"
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
| data|[ProviderEntity](#schemaproviderentity)|true|none||新建提供商|

## PUT 更新 LLM 提供商

PUT /models/providers/{id}

> Body 请求参数

```json
{
  "name": "OpenAI Production",
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-new-key"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |提供商ID|
|body|body|object| 否 |none|
| name|body|string| 否 |提供商名称|
| baseUrl|body|string| 否 |API 基础 URL|
| apiKey|body|string| 否 |API Key|
| config|body|string(json)| 否 |附加配置|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "prov_001",
    "tenantId": "system",
    "name": "OpenAI Production",
    "type": "openai",
    "baseUrl": "https://api.openai.com/v1",
    "status": "active",
    "updatedAt": "2026-03-05T12:00:00Z"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|更新成功|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|提供商不存在|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[ProviderEntity](#schemaproviderentity)|true|none||更新后的提供商|

## DELETE 删除 LLM 提供商

DELETE /models/providers/{id}

软删除，将状态置为 deleted。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |提供商ID|

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
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|提供商不存在|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|

## GET 列出提供商的模型定义

GET /models/providers/{id}/models

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |提供商ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": [
    {
      "id": "md_001",
      "providerId": "prov_001",
      "modelId": "gpt-4o",
      "displayName": "GPT-4o",
      "category": "chat",
      "maxTokens": 128000,
      "capabilities": "{\"vision\":true,\"function_calling\":true}",
      "status": "active",
      "createdAt": "2026-01-01T00:00:00Z"
    },
    {
      "id": "md_002",
      "providerId": "prov_001",
      "modelId": "text-embedding-3-small",
      "displayName": "Embedding 3 Small",
      "category": "embedding",
      "maxTokens": 8191,
      "capabilities": "{}",
      "status": "active",
      "createdAt": "2026-01-01T00:00:00Z"
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
| data|[[ModelDefinitionEntity](#schemamodeldefinitionentity)]|true|none||模型定义列表|
| id|string|true|none||模型定义ID|
| providerId|string|true|none||所属提供商ID|
| modelId|string|true|none||模型标识，如 gpt-4o|
| displayName|string|false|none||显示名称|
| category|string|false|none||模型分类|
| maxTokens|integer|false|none||最大 token 数|
| capabilities|string(json)|false|none||模型能力（JSON）|
| status|string|true|none||状态|
| createdAt|string(date-time)|true|none||创建时间|

#### 枚举值

|属性|值|
|---|---|
|category|chat|
|category|embedding|
|category|completion|
|status|active|
|status|deleted|

## POST 添加模型定义

POST /models/providers/{id}/models

> Body 请求参数

```json
{
  "modelId": "gpt-4o-mini",
  "displayName": "GPT-4o Mini",
  "category": "chat",
  "maxTokens": 128000,
  "capabilities": "{\"vision\":true,\"function_calling\":true}"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |提供商ID|
|body|body|[ModelDefinitionEntity](#schemamodeldefinitionentity)| 是 |none|
| modelId|body|string| 是 |模型标识|
| displayName|body|string| 否 |显示名称|
| category|body|string| 否 |模型分类（chat / embedding / completion）|
| maxTokens|body|integer| 否 |最大 token 数|
| capabilities|body|string(json)| 否 |模型能力（JSON）|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "md_new001",
    "providerId": "prov_001",
    "modelId": "gpt-4o-mini",
    "displayName": "GPT-4o Mini",
    "category": "chat",
    "maxTokens": 128000,
    "status": "active",
    "createdAt": "2026-03-05T10:30:00Z"
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
| data|[ModelDefinitionEntity](#schemamodeldefinitionentity)|true|none||新建模型定义|

# 模型池管理 (Model Pool)

## POST 创建模型池

POST /models/pools

> Body 请求参数

```json
{
  "name": "Production Chat Pool",
  "strategy": "priority",
  "fallbackPoolId": null,
  "description": "主要的聊天模型池，按优先级路由"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 否 |租户ID，默认 system|
|body|body|[ModelPoolEntity](#schemamodelpoolentity)| 是 |none|
| name|body|string| 是 |模型池名称|
| strategy|body|string| 是 |路由策略|
| fallbackPoolId|body|string| 否 |降级模型池ID|
| description|body|string| 否 |描述|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "pool_001",
    "tenantId": "system",
    "name": "Production Chat Pool",
    "strategy": "priority",
    "fallbackPoolId": null,
    "description": "主要的聊天模型池，按优先级路由",
    "status": "active",
    "createdAt": "2026-03-05T10:30:00Z",
    "updatedAt": "2026-03-05T10:30:00Z"
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
| data|[ModelPoolEntity](#schemamodelpoolentity)|true|none||模型池信息|
| id|string|true|none||模型池ID|
| tenantId|string|true|none||租户ID|
| name|string|true|none||名称|
| strategy|string|true|none||路由策略|
| fallbackPoolId|string|false|none||降级模型池ID|
| description|string|false|none||描述|
| status|string|true|none||状态|
| createdAt|string(date-time)|true|none||创建时间|
| updatedAt|string(date-time)|true|none||更新时间|

#### 枚举值

|属性|值|
|---|---|
|strategy|priority|
|strategy|round_robin|
|strategy|lowest_latency|
|status|active|
|status|deleted|

## GET 列出模型池

GET /models/pools

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 否 |租户ID，不传则返回全部活跃模型池|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": [
    {
      "id": "pool_001",
      "tenantId": "system",
      "name": "Production Chat Pool",
      "strategy": "priority",
      "status": "active",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
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
| data|[[ModelPoolEntity](#schemamodelpoolentity)]|true|none||模型池列表（仅活跃状态）|

## GET 按 ID 查询模型池

GET /models/pools/{id}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |模型池ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "pool_001",
    "tenantId": "system",
    "name": "Production Chat Pool",
    "strategy": "priority",
    "fallbackPoolId": "pool_fallback",
    "description": "主要的聊天模型池",
    "status": "active",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z"
  }
}
```

> 404 Response

```json
{
  "code": 40400,
  "message": "Pool not found"
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|模型池不存在|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[ModelPoolEntity](#schemamodelpoolentity)|true|none||模型池信息|

## PUT 更新模型池

PUT /models/pools/{id}

> Body 请求参数

```json
{
  "name": "Updated Pool Name",
  "strategy": "round_robin",
  "description": "改为轮询策略"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |模型池ID|
|body|body|object| 否 |none|
| name|body|string| 否 |名称|
| strategy|body|string| 否 |路由策略|
| fallbackPoolId|body|string| 否 |降级模型池ID|
| description|body|string| 否 |描述|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "pool_001",
    "name": "Updated Pool Name",
    "strategy": "round_robin",
    "status": "active",
    "updatedAt": "2026-03-05T12:00:00Z"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|更新成功|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|模型池不存在|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[ModelPoolEntity](#schemamodelpoolentity)|true|none||更新后的模型池|

## DELETE 删除模型池

DELETE /models/pools/{id}

软删除，将状态置为 deleted。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |模型池ID|

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
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|模型池不存在|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|

# 模型池目标 (Pool Targets)

## POST 添加目标到模型池

POST /models/pools/{poolId}/targets

> Body 请求参数

```json
{
  "providerId": "prov_001",
  "modelId": "gpt-4o",
  "priority": 1,
  "weight": 100
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|poolId|path|string| 是 |模型池ID|
|body|body|[ModelPoolTargetEntity](#schemamodelpooltargetentity)| 是 |none|
| providerId|body|string| 是 |提供商ID|
| modelId|body|string| 是 |模型标识|
| priority|body|integer| 否 |优先级，数值越小优先级越高（priority 策略使用）|
| weight|body|integer| 否 |权重（round_robin / weighted 策略使用）|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "pt_001",
    "poolId": "pool_001",
    "providerId": "prov_001",
    "modelId": "gpt-4o",
    "priority": 1,
    "weight": 100,
    "status": "active",
    "createdAt": "2026-03-05T10:30:00Z"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|添加成功|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|模型池不存在|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[ModelPoolTargetEntity](#schemamodelpooltargetentity)|true|none||目标信息|
| id|string|true|none||目标ID|
| poolId|string|true|none||所属模型池ID|
| providerId|string|true|none||提供商ID|
| modelId|string|true|none||模型标识|
| priority|integer|true|none||优先级|
| weight|integer|true|none||权重|
| status|string|true|none||状态|
| createdAt|string(date-time)|true|none||创建时间|

## GET 列出模型池目标

GET /models/pools/{poolId}/targets

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|poolId|path|string| 是 |模型池ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": [
    {
      "id": "pt_001",
      "poolId": "pool_001",
      "providerId": "prov_001",
      "modelId": "gpt-4o",
      "priority": 1,
      "weight": 100,
      "status": "active",
      "createdAt": "2026-03-05T10:30:00Z"
    },
    {
      "id": "pt_002",
      "poolId": "pool_001",
      "providerId": "prov_002",
      "modelId": "claude-3-5-sonnet",
      "priority": 2,
      "weight": 80,
      "status": "active",
      "createdAt": "2026-03-05T10:35:00Z"
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
| data|[[ModelPoolTargetEntity](#schemamodelpooltargetentity)]|true|none||目标列表，按优先级升序|

## DELETE 移除模型池目标

DELETE /models/pools/{poolId}/targets/{targetId}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|poolId|path|string| 是 |模型池ID|
|targetId|path|string| 是 |目标ID|

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
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|移除成功|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|目标不存在|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|

# 路由规则 (Routing Rules)

## POST 创建路由规则

POST /models/pools/rules

> Body 请求参数

```json
{
  "name": "VIP Coding Route",
  "ruleOrder": 1,
  "conditions": "[{\"field\":\"intent_type\",\"operator\":\"==\",\"value\":\"coding\"},{\"field\":\"user_group\",\"operator\":\"==\",\"value\":\"vip\"}]",
  "targetPoolId": "pool_001",
  "fallbackPoolId": "pool_fallback"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 否 |租户ID，默认 system|
|body|body|[RoutingRuleEntity](#schemaroutingruleentity)| 是 |none|
| name|body|string| 是 |规则名称|
| ruleOrder|body|integer| 是 |评估顺序，数值越小越优先，首条匹配生效|
| conditions|body|string(json)| 是 |条件数组（JSON），所有条件取 AND 逻辑|
| targetPoolId|body|string| 是 |匹配时路由到的目标模型池ID|
| fallbackPoolId|body|string| 否 |目标池失败时的降级模型池ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "rule_001",
    "tenantId": "system",
    "name": "VIP Coding Route",
    "ruleOrder": 1,
    "conditions": "[{\"field\":\"intent_type\",\"operator\":\"==\",\"value\":\"coding\"},{\"field\":\"user_group\",\"operator\":\"==\",\"value\":\"vip\"}]",
    "targetPoolId": "pool_001",
    "fallbackPoolId": "pool_fallback",
    "status": "active",
    "createdAt": "2026-03-05T10:30:00Z",
    "updatedAt": "2026-03-05T10:30:00Z"
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
| data|[RoutingRuleEntity](#schemaroutingruleentity)|true|none||路由规则|
| id|string|true|none||规则ID|
| tenantId|string|true|none||租户ID|
| name|string|true|none||规则名称|
| ruleOrder|integer|true|none||评估顺序|
| conditions|string(json)|true|none||条件数组（JSON）|
| targetPoolId|string|true|none||目标模型池ID|
| fallbackPoolId|string|false|none||降级模型池ID|
| status|string|true|none||状态|
| createdAt|string(date-time)|true|none||创建时间|
| updatedAt|string(date-time)|true|none||更新时间|

### 条件格式说明

conditions 为 JSON 数组，每个条件包含：

|字段|类型|说明|
|---|---|---|
|field|string|匹配字段，如 intent_type, user_group, model 等|
|operator|string|操作符，如 ==, !=, in, contains|
|value|string|匹配值|

所有条件取 AND 逻辑，全部满足时规则生效。

## GET 列出路由规则

GET /models/pools/rules

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 否 |租户ID，不传则返回全部|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": [
    {
      "id": "rule_001",
      "tenantId": "system",
      "name": "VIP Coding Route",
      "ruleOrder": 1,
      "conditions": "[{\"field\":\"intent_type\",\"operator\":\"==\",\"value\":\"coding\"}]",
      "targetPoolId": "pool_001",
      "status": "active",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    },
    {
      "id": "rule_002",
      "tenantId": "system",
      "name": "Default Route",
      "ruleOrder": 100,
      "conditions": "[]",
      "targetPoolId": "pool_default",
      "status": "active",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
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
| data|[[RoutingRuleEntity](#schemaroutingruleentity)]|true|none||规则列表，按 ruleOrder 升序|

## PUT 更新路由规则

PUT /models/pools/rules/{id}

> Body 请求参数

```json
{
  "name": "Updated Rule",
  "ruleOrder": 2,
  "conditions": "[{\"field\":\"intent_type\",\"operator\":\"==\",\"value\":\"qa\"}]",
  "targetPoolId": "pool_002"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |规则ID|
|body|body|object| 是 |none|
| name|body|string| 否 |规则名称|
| ruleOrder|body|integer| 否 |评估顺序|
| conditions|body|string(json)| 否 |条件数组|
| targetPoolId|body|string| 否 |目标模型池ID|
| fallbackPoolId|body|string| 否 |降级模型池ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "rule_001",
    "name": "Updated Rule",
    "ruleOrder": 2,
    "targetPoolId": "pool_002",
    "status": "active",
    "updatedAt": "2026-03-05T12:00:00Z"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|更新成功|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|规则不存在|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[RoutingRuleEntity](#schemaroutingruleentity)|true|none||更新后的规则|

## DELETE 删除路由规则

DELETE /models/pools/rules/{id}

软删除，将状态置为 deleted。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |规则ID|

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
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|规则不存在|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|

# 租户模型分配 (Tenant Provider Assignment)

## POST 分配平台模型给租户

POST /models/providers/{providerId}/tenants

将一个平台级 Provider（tenantId=system）分配给指定租户使用。

> Body 请求参数

```json
{
  "tenantId": "tenant_dychoice"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|providerId|path|string| 是 |平台 Provider ID|
|body|body|object| 是 |none|
| tenantId|body|string| 是 |目标租户ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "tp_001",
    "tenantId": "tenant_dychoice",
    "providerId": "prov_001",
    "status": "active",
    "createdAt": "2026-03-05T12:00:00Z"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|分配成功|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|只能分配平台级 Provider / 已分配|Inline|

## DELETE 撤销租户模型分配

DELETE /models/providers/{providerId}/tenants/{tenantId}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|providerId|path|string| 是 |Provider ID|
|tenantId|path|string| 是 |租户ID|

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
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|撤销成功|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|分配记录不存在|Inline|

## GET 查看 Provider 已分配的租户

GET /models/providers/{providerId}/tenants

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|providerId|path|string| 是 |Provider ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": [
    {
      "id": "tp_001",
      "tenantId": "tenant_dychoice",
      "providerId": "prov_001",
      "status": "active",
      "createdAt": "2026-03-05T12:00:00Z"
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

## GET 查看租户可用的 Provider 列表

GET /models/providers/assigned

返回租户自有的 Provider + 平台分配给该租户的 Provider。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 是 |租户ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": [
    {
      "id": "prov_001",
      "tenantId": "system",
      "name": "OpenAI",
      "type": "openai",
      "apiKey": "sk-proj-***",
      "status": "active"
    },
    {
      "id": "prov_tenant_001",
      "tenantId": "tenant_dychoice",
      "name": "My DeepSeek",
      "type": "openai",
      "apiKey": "sk-xxxx***",
      "status": "active"
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 模型访问权限说明

| 角色 | GET /models/providers | 可用模型范围 |
|------|----------------------|-------------|
| 平台管理员 (tenantId=system/*) | 返回所有 Provider | 所有模型 |
| 租户用户 | 返回自有 + 已分配的 Provider | 仅可访问的模型 |

租户调用 LLM 时（chat/task），ModelRouter 会自动校验 Provider 是否对该租户可用。未分配的平台模型对租户不可见、不可调用。

# 健康检查

## GET 健康检查

GET /health

> 返回示例

> 200 Response

```json
{
  "status": "UP"
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|服务正常|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| status|string|true|none||服务状态|
