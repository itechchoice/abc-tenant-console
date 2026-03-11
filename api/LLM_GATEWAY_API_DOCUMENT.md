# ABC LLM Gateway 接口文档

> 版本：v1.0  
> 基础 URL：`http://{host}:9202`  
> 最后更新：2026-03-10

---

## 目录

- [1. 概述](#1-概述)
- [2. 通用约定](#2-通用约定)
  - [2.1 请求头](#21-请求头)
  - [2.2 统一响应格式（管理接口）](#22-统一响应格式管理接口)
  - [2.3 错误码一览](#23-错误码一览)
  - [2.4 分页参数](#24-分页参数)
  - [2.5 时间格式](#25-时间格式)
- [3. 健康检查](#3-健康检查)
- [4. 网关接口（OpenAI 兼容）](#4-网关接口openai-兼容)
  - [4.1 聊天补全（非流式）](#41-聊天补全非流式)
  - [4.2 聊天补全（流式 SSE）](#42-聊天补全流式-sse)
  - [4.3 文本嵌入](#43-文本嵌入)
  - [4.4 模型列表](#44-模型列表)
- [5. Provider 管理接口](#5-provider-管理接口)
  - [5.1 创建 Provider](#51-创建-provider)
  - [5.2 查询 Provider 列表](#52-查询-provider-列表)
  - [5.3 查询 Provider 详情](#53-查询-provider-详情)
  - [5.4 更新 Provider](#54-更新-provider)
  - [5.5 删除 Provider](#55-删除-provider)
  - [5.6 更新 Provider 状态](#56-更新-provider-状态)
- [6. 模型管理接口](#6-模型管理接口)
  - [6.1 创建模型（关联 Provider）](#61-创建模型关联-provider)
  - [6.2 查询 Provider 下的模型列表](#62-查询-provider-下的模型列表)
  - [6.3 查询全部模型列表](#63-查询全部模型列表)
  - [6.4 查询模型详情](#64-查询模型详情)
  - [6.5 更新模型](#65-更新模型)
  - [6.6 删除模型](#66-删除模型)
  - [6.7 更新模型状态](#67-更新模型状态)
- [7. 模型池管理接口](#7-模型池管理接口)
  - [7.1 创建模型池](#71-创建模型池)
  - [7.2 查询模型池列表](#72-查询模型池列表)
  - [7.3 查询模型池详情](#73-查询模型池详情)
  - [7.4 更新模型池](#74-更新模型池)
  - [7.5 删除模型池](#75-删除模型池)
  - [7.6 添加池成员](#76-添加池成员)
  - [7.7 移除池成员](#77-移除池成员)
  - [7.8 查询池成员列表](#78-查询池成员列表)
- [8. 限流管理接口](#8-限流管理接口)
  - [8.1 创建限流规则](#81-创建限流规则)
  - [8.2 查询限流规则列表](#82-查询限流规则列表)
  - [8.3 删除限流规则](#83-删除限流规则)
- [9. Token 配额管理接口](#9-token-配额管理接口)
  - [9.1 创建配额](#91-创建配额)
  - [9.2 查询配额列表](#92-查询配额列表)
  - [9.3 删除配额](#93-删除配额)
  - [9.4 重置配额](#94-重置配额)
- [10. 用量统计接口](#10-用量统计接口)
  - [10.1 用量汇总](#101-用量汇总)
  - [10.2 按模型统计](#102-按模型统计)
  - [10.3 按 Provider 统计](#103-按-provider-统计)
  - [10.4 每日趋势](#104-每日趋势)

---

## 1. 概述

ABC LLM Gateway 是一个大语言模型统一网关服务，提供 **OpenAI 兼容的 API 格式**，统一接入多家 LLM 供应商（OpenAI、Anthropic、Gemini 等）。系统支持：

- **多 Provider 接入**：通过后台配置不同的 Provider 和模型
- **租户隔离**：基于 `X-Tenant-Id` 实现多租户数据隔离
- **限流控制**：支持 RPM（每分钟请求数）和 TPM（每分钟 Token 数）限流
- **Token 配额**：按租户设置 Token 使用配额
- **模型路由**：支持模型池、负载均衡和智能路由（`auto` 模型）
- **用量统计**：提供多维度的 Token 消耗和费用统计
- **请求追踪**：全链路 RequestId 追踪

---

## 2. 通用约定

### 2.1 请求头

所有接口都支持以下公共请求头：

| 请求头 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `X-Request-Id` | String | 否 | 请求追踪 ID。若未传则服务端自动生成 UUID，始终在响应头中返回 |
| `X-Tenant-Id` | String(Long) | 否 | 租户 ID，用于多租户隔离、限流、配额等功能。管理接口必须传入 |
| `X-User-Id` | String(Long) | 否 | 用户 ID，用于审计记录（`created_by` / `updated_by` 字段自动填充） |
| `Content-Type` | String | 是 | POST/PUT/PATCH 请求固定为 `application/json` |

**响应头：**

| 响应头 | 说明 |
|--------|------|
| `X-Request-Id` | 返回本次请求的追踪 ID（与请求头传入值一致，或为自动生成值） |

### 2.2 统一响应格式（管理接口）

所有管理接口（`/api/admin/**`）返回统一的 `Result<T>` 包装格式：

```json
{
  "code": 0,
  "message": "success",
  "data": { ... },
  "requestId": "a1b2c3d4e5f6..."
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | Integer | 状态码，`0` 表示成功，非 `0` 表示异常 |
| `message` | String | 描述信息，成功时为 `"success"`，失败时为错误描述 |
| `data` | Object / null | 业务数据，错误时为 `null` |
| `requestId` | String | 请求追踪 ID |

> **注意**：网关接口（`/v1/**`）遵循 OpenAI 标准格式，不使用 `Result` 包装。

### 2.3 错误码一览

| 错误码 | 名称 | 说明 |
|--------|------|------|
| `0` | SUCCESS | 成功 |
| `400` | BAD_REQUEST | 请求参数错误（含参数校验失败） |
| `404` | NOT_FOUND | 资源不存在 |
| `405` | METHOD_NOT_ALLOWED | HTTP 方法不允许 |
| `429` | RATE_LIMIT_EXCEEDED | 请求频率超出限流规则 |
| `500` | INTERNAL_ERROR | 服务器内部错误 |
| `502` | PROVIDER_ERROR | 上游 Provider 返回错误 |
| `504` | PROVIDER_TIMEOUT | 上游 Provider 请求超时 |
| `1001` | MODEL_NOT_FOUND | 模型不存在或未配置 |
| `1002` | PROVIDER_NOT_FOUND | Provider 不存在 |
| `1003` | PROVIDER_DISABLED | Provider 已被禁用 |
| `1004` | MODEL_DISABLED | 模型已被禁用 |
| `1005` | NO_AVAILABLE_MODEL | 没有可用模型（路由时无可选模型） |
| `1006` | POOL_NOT_FOUND | 模型池不存在 |
| `1007` | CIRCUIT_OPEN | 熔断器已开启 |
| `4291` | QUOTA_EXCEEDED | Token 配额已用尽 |

**错误响应示例：**

```json
{
  "code": 1001,
  "message": "Model not found: gpt-5",
  "data": null,
  "requestId": "a1b2c3d4e5f6"
}
```

### 2.4 分页参数

部分列表接口支持 Spring Data 标准分页参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | Integer | `0` | 页码，从 0 开始 |
| `size` | Integer | `20` | 每页条数 |
| `sort` | String | - | 排序字段和方向，如 `createdAt,desc` |

**分页响应结构（`Page<T>`）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "content": [ ... ],
    "totalElements": 50,
    "totalPages": 3,
    "size": 20,
    "number": 0,
    "first": true,
    "last": false,
    "empty": false
  },
  "requestId": "..."
}
```

### 2.5 时间格式

| 场景 | 格式 | 示例 |
|------|------|------|
| 审计时间字段（`createdAt`、`updatedAt`） | ISO 8601 时间戳 | `"2026-03-10T08:30:00Z"` |
| 日期查询参数（`start`、`end`） | ISO 日期 | `2026-03-01` |
| 配额周期起始日（`periodStart`） | ISO 日期 | `2026-03-01` |

---

## 3. 健康检查

### `GET /health`

检查服务及其依赖组件的健康状态。

**请求参数：** 无

**响应示例：**

```json
{
  "status": "UP",
  "database": "UP",
  "redis": "UP"
}
```

**响应字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `status` | String | 服务整体状态：`UP` 正常 / `DEGRADED` 降级 |
| `database` | String | 数据库连接状态：`UP` / `DOWN` |
| `redis` | String | Redis 连接状态：`UP` / `DOWN` |

**HTTP 状态码：**

| 状态码 | 说明 |
|--------|------|
| `200` | 服务正常（数据库可用） |
| `503` | 服务降级（数据库不可用） |

> Redis 不可用时不影响服务整体状态，仅限流功能降级。

---

## 4. 网关接口（OpenAI 兼容）

网关接口遵循 **OpenAI API 标准格式**，可直接使用 OpenAI SDK 或任何兼容客户端对接。

### 4.1 聊天补全（非流式）

#### `POST /v1/chat/completions`

调用 LLM 模型进行对话补全。

**请求体：**

```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello!"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false
}
```

**请求字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | String | **是** | 模型标识符。可以是具体模型 ID（如 `gpt-4o-mini`）、模型池名称、或 `auto`（自动选择） |
| `messages` | Array\<ChatMessage\> | **是** | 对话消息列表，至少包含一条消息 |
| `temperature` | Double | 否 | 采样温度，范围 0~2，默认由模型决定 |
| `top_p` | Double | 否 | 核采样参数，范围 0~1 |
| `n` | Integer | 否 | 返回的补全选项数量 |
| `stream` | Boolean | 否 | 是否启用流式输出，默认 `false` |
| `stop` | Array\<String\> | 否 | 停止词列表 |
| `max_tokens` | Integer | 否 | 最大输出 Token 数 |
| `presence_penalty` | Double | 否 | 存在惩罚，范围 -2.0~2.0 |
| `frequency_penalty` | Double | 否 | 频率惩罚，范围 -2.0~2.0 |
| `tools` | Array\<ToolDefinition\> | 否 | Function Calling 工具定义列表 |
| `tool_choice` | Object / String | 否 | 工具选择策略 |
| `response_format` | Object | 否 | 响应格式配置，如 `{"type": "json_object"}` |
| `user` | String | 否 | 终端用户标识 |

**ChatMessage 结构：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `role` | String | **是** | 消息角色：`system`、`user`、`assistant`、`tool` |
| `content` | String / Array | **是** | 消息内容。文本类型直接传字符串，多模态时传数组 |
| `name` | String | 否 | 发送者名称 |
| `tool_calls` | Array\<ToolCall\> | 否 | 工具调用信息（assistant 角色消息中返回） |
| `tool_call_id` | String | 否 | 工具调用结果关联的 tool_call ID（tool 角色消息中使用） |

**ToolDefinition 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | String | 固定为 `"function"` |
| `function` | FunctionDefinition | 函数定义 |

**FunctionDefinition 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | String | 函数名称 |
| `description` | String | 函数描述 |
| `parameters` | Object | JSON Schema 格式的参数定义 |

**ToolCall 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | String | 工具调用 ID |
| `type` | String | 固定为 `"function"` |
| `function` | FunctionCall | 函数调用信息 |

**FunctionCall 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | String | 被调用的函数名称 |
| `arguments` | String | 函数参数的 JSON 字符串 |

**成功响应：**

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1710000000,
  "model": "gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 10,
    "total_tokens": 30
  },
  "system_fingerprint": "fp_abc123"
}
```

**响应字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | String | 补全请求的唯一标识 |
| `object` | String | 固定为 `"chat.completion"` |
| `created` | Long | 创建时间戳（Unix epoch 秒） |
| `model` | String | 实际使用的模型名称 |
| `choices` | Array\<Choice\> | 补全结果列表 |
| `usage` | Usage | Token 使用统计 |
| `system_fingerprint` | String | 系统指纹（可能为 null） |

**Choice 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `index` | Integer | 选项索引 |
| `message` | ChatMessage | 补全的消息内容 |
| `finish_reason` | String | 完成原因：`stop`、`length`、`tool_calls`、`content_filter` |

**Usage 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `prompt_tokens` | Integer | 输入 Token 数量 |
| `completion_tokens` | Integer | 输出 Token 数量 |
| `total_tokens` | Integer | 总 Token 数量 |

### 4.2 聊天补全（流式 SSE）

有两种方式触发流式输出：

#### 方式一：`POST /v1/chat/completions`（设置 `stream: true`）

请求体与非流式相同，将 `stream` 字段设为 `true`。

#### 方式二：`POST /v1/chat/completions/stream`

请求体与非流式相同（无需设置 `stream` 字段，服务端自动启用流式）。

**响应格式：** `text/event-stream`（Server-Sent Events）

每个 SSE 事件的 `data` 字段包含一个 JSON 对象（`ChatCompletionChunk`）：

```
data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1710000000,"model":"gpt-4o-mini","choices":[{"index":0,"delta":{"role":"assistant","content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1710000000,"model":"gpt-4o-mini","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1710000000,"model":"gpt-4o-mini","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":20,"completion_tokens":2,"total_tokens":22}}

data: [DONE]
```

**ChatCompletionChunk 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | String | 补全请求的唯一标识 |
| `object` | String | 固定为 `"chat.completion.chunk"` |
| `created` | Long | 创建时间戳 |
| `model` | String | 实际使用的模型名称 |
| `choices` | Array\<ChunkChoice\> | 增量结果列表 |
| `usage` | Usage | Token 使用统计（通常仅在最后一个 chunk 中出现） |

**ChunkChoice 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `index` | Integer | 选项索引 |
| `delta` | ChatMessage | 增量消息内容（只包含新增部分） |
| `finish_reason` | String / null | 完成原因，流传输过程中为 `null`，最后一个 chunk 为 `"stop"` |

**前端接入示例（JavaScript）：**

```javascript
const response = await fetch('http://{host}:9202/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-Id': '1001',
    'X-User-Id': '1'
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Hello!' }],
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  const lines = text.split('\n').filter(line => line.startsWith('data: '));

  for (const line of lines) {
    const data = line.slice(6); // 去掉 "data: " 前缀
    if (data === '[DONE]') {
      console.log('Stream finished');
      break;
    }
    const chunk = JSON.parse(data);
    const content = chunk.choices?.[0]?.delta?.content;
    if (content) {
      process.stdout.write(content); // 逐字输出
    }
  }
}
```

**cURL 测试示例：**

```bash
curl -N -X POST http://localhost:9202/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 1001" \
  -H "X-User-Id: 1" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

### 4.3 文本嵌入

#### `POST /v1/embeddings`

调用模型生成文本向量嵌入。

**请求体：**

```json
{
  "model": "text-embedding-3-small",
  "input": "The quick brown fox jumps over the lazy dog.",
  "encoding_format": "float"
}
```

**请求字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | String | **是** | 嵌入模型标识符 |
| `input` | String / Array | **是** | 待嵌入的文本，可以是单个字符串或字符串数组 |
| `encoding_format` | String | 否 | 编码格式，如 `"float"` 或 `"base64"` |
| `dimensions` | Integer | 否 | 输出向量维度 |
| `user` | String | 否 | 终端用户标识 |

**成功响应：**

```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "embedding": [0.0023064255, -0.009327292, ...],
      "index": 0
    }
  ],
  "model": "text-embedding-3-small",
  "usage": {
    "prompt_tokens": 8,
    "completion_tokens": 0,
    "total_tokens": 8
  }
}
```

**响应字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `object` | String | 固定为 `"list"` |
| `data` | Array\<EmbeddingData\> | 嵌入结果列表 |
| `model` | String | 实际使用的模型名称 |
| `usage` | Usage | Token 使用统计 |

**EmbeddingData 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `object` | String | 固定为 `"embedding"` |
| `embedding` | Array\<Double\> | 嵌入向量 |
| `index` | Integer | 在输入列表中的索引 |

### 4.4 模型列表

#### `GET /v1/models`

获取当前租户可用的所有模型列表。

**请求参数：** 无

**成功响应：**

```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-4o-mini",
      "object": "model",
      "created": 1710000000,
      "owned_by": "OPENAI"
    },
    {
      "id": "claude-3-haiku-20240307",
      "object": "model",
      "created": 1710000000,
      "owned_by": "ANTHROPIC"
    },
    {
      "id": "auto",
      "object": "model",
      "created": 1710000000,
      "owned_by": "system"
    }
  ]
}
```

**ModelObject 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | String | 模型标识符（在请求 `/v1/chat/completions` 时使用） |
| `object` | String | 固定为 `"model"` |
| `created` | Long | 创建时间戳 |
| `owned_by` | String | 所属 Provider 类型（如 `OPENAI`、`ANTHROPIC`、`GEMINI`），`auto` 模型为 `system` |

> 返回列表中包含一个特殊的 `auto` 模型，使用该模型标识符时系统会自动选择可用模型进行路由。

---

## 5. Provider 管理接口

Provider 表示一个 LLM 服务供应商（如 OpenAI、Anthropic、Gemini 等）。

### 5.1 创建 Provider

#### `POST /api/admin/providers`

**请求体：**

```json
{
  "name": "OpenAI Production",
  "providerType": "OPENAI",
  "baseUrl": "https://api.openai.com",
  "apiKey": "sk-proj-xxxxx",
  "configJson": {
    "timeout": 30000
  }
}
```

**请求字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | String | **是** | Provider 名称 |
| `providerType` | String | **是** | Provider 类型，可选值：`OPENAI`、`ANTHROPIC`、`GEMINI` |
| `baseUrl` | String | 否 | API 基础 URL，不传则使用各 Provider 的默认地址 |
| `apiKey` | String | 否 | API 密钥（存储时会通过 KMS 加密） |
| `configJson` | Object | 否 | 自定义配置，键值对格式 |

**成功响应：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1892374650123456,
    "name": "OpenAI Production",
    "providerType": "OPENAI",
    "baseUrl": "https://api.openai.com",
    "enabled": true,
    "configJson": { "timeout": 30000 },
    "hasApiKey": true,
    "createdBy": 1,
    "updatedBy": 1,
    "createdAt": "2026-03-10T08:30:00Z",
    "updatedAt": "2026-03-10T08:30:00Z"
  },
  "requestId": "a1b2c3d4e5f6"
}
```

**ProviderResponse 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | Long | Provider 唯一 ID（雪花算法生成） |
| `name` | String | Provider 名称 |
| `providerType` | String | Provider 类型 |
| `baseUrl` | String | API 基础 URL |
| `enabled` | Boolean | 是否启用 |
| `configJson` | Object | 自定义配置 |
| `hasApiKey` | Boolean | 是否已配置 API Key（出于安全不返回明文） |
| `createdBy` | Long | 创建人 ID |
| `updatedBy` | Long | 最后修改人 ID |
| `createdAt` | String | 创建时间（ISO 8601） |
| `updatedAt` | String | 最后修改时间（ISO 8601） |

### 5.2 查询 Provider 列表

#### `GET /api/admin/providers`

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `providerType` | String | 否 | 按 Provider 类型筛选 |
| `page` | Integer | 否 | 页码，默认 `0` |
| `size` | Integer | 否 | 每页条数，默认 `20` |
| `sort` | String | 否 | 排序，如 `createdAt,desc` |

**成功响应：** `Result<Page<ProviderResponse>>`

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "content": [
      {
        "id": 1892374650123456,
        "name": "OpenAI Production",
        "providerType": "OPENAI",
        "baseUrl": "https://api.openai.com",
        "enabled": true,
        "configJson": null,
        "hasApiKey": true,
        "createdBy": 1,
        "updatedBy": 1,
        "createdAt": "2026-03-10T08:30:00Z",
        "updatedAt": "2026-03-10T08:30:00Z"
      }
    ],
    "totalElements": 3,
    "totalPages": 1,
    "size": 20,
    "number": 0,
    "first": true,
    "last": true,
    "empty": false
  },
  "requestId": "..."
}
```

### 5.3 查询 Provider 详情

#### `GET /api/admin/providers/{id}`

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | Long | Provider ID |

**成功响应：** `Result<ProviderResponse>`

### 5.4 更新 Provider

#### `PUT /api/admin/providers/{id}`

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | Long | Provider ID |

**请求体：**

```json
{
  "name": "OpenAI Production Updated",
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-proj-newkey"
}
```

**请求字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | String | 否 | Provider 名称 |
| `providerType` | String | 否 | Provider 类型 |
| `baseUrl` | String | 否 | API 基础 URL |
| `apiKey` | String | 否 | API 密钥 |
| `configJson` | Object | 否 | 自定义配置 |

> 只传需要更新的字段，未传的字段保持不变。

**成功响应：** `Result<ProviderResponse>`

### 5.5 删除 Provider

#### `DELETE /api/admin/providers/{id}`

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | Long | Provider ID |

**成功响应：**

```json
{
  "code": 0,
  "message": "success",
  "data": null,
  "requestId": "..."
}
```

### 5.6 更新 Provider 状态

#### `PATCH /api/admin/providers/{id}/status`

启用或禁用 Provider。被禁用的 Provider 下的模型将无法被调用。

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | Long | Provider ID |

**请求体：**

```json
{
  "enabled": false
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `enabled` | Boolean | **是** | `true` 启用 / `false` 禁用 |

**成功响应：** `Result<ProviderResponse>`

---

## 6. 模型管理接口

模型隶属于某个 Provider，表示该 Provider 下可用的一个具体 LLM 模型。

### 6.1 创建模型（关联 Provider）

#### `POST /api/admin/providers/{providerId}/models`

在指定 Provider 下创建一个新模型。

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `providerId` | Long | 所属 Provider 的 ID |

**请求体：**

```json
{
  "modelId": "gpt-4o-mini",
  "displayName": "GPT-4o Mini",
  "modelType": "CHAT",
  "inputPricePer1kTokens": 0.00015,
  "outputPricePer1kTokens": 0.0006,
  "configJson": {
    "maxContextLength": 128000
  }
}
```

**请求字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `modelId` | String | **是** | 模型标识符（用于 API 调用时的 `model` 参数，如 `gpt-4o-mini`） |
| `displayName` | String | 否 | 模型显示名称 |
| `modelType` | String | **是** | 模型类型：`CHAT`（对话）、`EMBEDDING`（嵌入） |
| `inputPricePer1kTokens` | BigDecimal | 否 | 输入 Token 单价（每 1000 Token，美元） |
| `outputPricePer1kTokens` | BigDecimal | 否 | 输出 Token 单价（每 1000 Token，美元） |
| `configJson` | Object | 否 | 模型自定义配置 |

**成功响应：** `Result<ModelResponse>`

**ModelResponse 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | Long | 模型记录唯一 ID（雪花算法） |
| `providerId` | Long | 所属 Provider ID |
| `modelId` | String | 模型标识符 |
| `displayName` | String | 显示名称 |
| `modelType` | String | 模型类型 |
| `enabled` | Boolean | 是否启用 |
| `inputPricePer1kTokens` | BigDecimal | 输入单价 |
| `outputPricePer1kTokens` | BigDecimal | 输出单价 |
| `configJson` | Object | 自定义配置 |
| `createdBy` | Long | 创建人 ID |
| `updatedBy` | Long | 最后修改人 ID |
| `createdAt` | String | 创建时间 |
| `updatedAt` | String | 最后修改时间 |

### 6.2 查询 Provider 下的模型列表

#### `GET /api/admin/providers/{providerId}/models`

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `providerId` | Long | Provider ID |

**查询参数：** 支持分页参数（`page`、`size`、`sort`）

**成功响应：** `Result<Page<ModelResponse>>`

### 6.3 查询全部模型列表

#### `GET /api/admin/models`

查询所有 Provider 下的模型，支持按类型和状态筛选。

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `modelType` | String | 否 | 按模型类型筛选：`CHAT` / `EMBEDDING` |
| `enabled` | Boolean | 否 | 按启用状态筛选 |
| `page` | Integer | 否 | 页码 |
| `size` | Integer | 否 | 每页条数 |
| `sort` | String | 否 | 排序 |

**成功响应：** `Result<Page<ModelResponse>>`

### 6.4 查询模型详情

#### `GET /api/admin/models/{id}`

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | Long | 模型记录 ID |

**成功响应：** `Result<ModelResponse>`

### 6.5 更新模型

#### `PUT /api/admin/models/{id}`

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | Long | 模型记录 ID |

**请求体：**

```json
{
  "displayName": "GPT-4o Mini (Updated)",
  "inputPricePer1kTokens": 0.0001,
  "outputPricePer1kTokens": 0.0004
}
```

**请求字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `displayName` | String | 否 | 显示名称 |
| `modelType` | String | 否 | 模型类型 |
| `inputPricePer1kTokens` | BigDecimal | 否 | 输入单价 |
| `outputPricePer1kTokens` | BigDecimal | 否 | 输出单价 |
| `configJson` | Object | 否 | 自定义配置 |

> 只传需要更新的字段。

**成功响应：** `Result<ModelResponse>`

### 6.6 删除模型

#### `DELETE /api/admin/models/{id}`

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | Long | 模型记录 ID |

**成功响应：** `Result<Void>`

### 6.7 更新模型状态

#### `PATCH /api/admin/models/{id}/status`

启用或禁用模型。被禁用的模型将无法被调用。

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | Long | 模型记录 ID |

**请求体：**

```json
{
  "enabled": true
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `enabled` | Boolean | **是** | `true` 启用 / `false` 禁用 |

**成功响应：** `Result<ModelResponse>`

---

## 7. 模型池管理接口

模型池用于将多个模型组织在一起，支持负载均衡和优先级路由。客户端在请求 `/v1/chat/completions` 时可以使用模型池名称作为 `model` 参数。

### 7.1 创建模型池

#### `POST /api/admin/pools`

**请求体：**

```json
{
  "poolName": "gpt-pool",
  "strategy": "ROUND_ROBIN"
}
```

**请求字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `poolName` | String | **是** | 模型池名称（客户端用此名称进行调用） |
| `strategy` | String | **是** | 路由策略：`ROUND_ROBIN`（轮询）、`RANDOM`（随机）、`PRIORITY`（优先级）、`WEIGHTED`（加权） |

**成功响应：** `Result<PoolResponse>`

**PoolResponse 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | Long | 模型池 ID |
| `poolName` | String | 模型池名称 |
| `strategy` | String | 路由策略 |
| `enabled` | Boolean | 是否启用 |
| `createdBy` | Long | 创建人 ID |
| `updatedBy` | Long | 最后修改人 ID |
| `createdAt` | String | 创建时间 |
| `updatedAt` | String | 最后修改时间 |

### 7.2 查询模型池列表

#### `GET /api/admin/pools`

**请求参数：** 无

**成功响应：** `Result<List<PoolResponse>>`

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1892374650123457,
      "poolName": "gpt-pool",
      "strategy": "ROUND_ROBIN",
      "enabled": true,
      "createdBy": 1,
      "updatedBy": 1,
      "createdAt": "2026-03-10T08:30:00Z",
      "updatedAt": "2026-03-10T08:30:00Z"
    }
  ],
  "requestId": "..."
}
```

### 7.3 查询模型池详情

#### `GET /api/admin/pools/{id}`

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | Long | 模型池 ID |

**成功响应：** `Result<PoolResponse>`

### 7.4 更新模型池

#### `PUT /api/admin/pools/{id}`

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | Long | 模型池 ID |

**请求体：**

```json
{
  "poolName": "gpt-pool-updated",
  "strategy": "WEIGHTED"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `poolName` | String | 否 | 新的池名称 |
| `strategy` | String | 否 | 新的路由策略 |

**成功响应：** `Result<PoolResponse>`

### 7.5 删除模型池

#### `DELETE /api/admin/pools/{id}`

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | Long | 模型池 ID |

**成功响应：** `Result<Void>`

### 7.6 添加池成员

#### `POST /api/admin/pools/{id}/members`

向模型池中添加一个模型成员。

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | Long | 模型池 ID |

**请求体：**

```json
{
  "modelId": 1892374650123456,
  "priority": 1,
  "weight": 10
}
```

**请求字段说明：**

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `modelId` | Long | **是** | - | 模型记录 ID（注意：是管理系统中的模型记录 ID，非模型标识符字符串） |
| `priority` | Integer | 否 | `0` | 优先级，数值越大优先级越高（用于 `PRIORITY` 策略） |
| `weight` | Integer | 否 | `1` | 权重（用于 `WEIGHTED` 策略） |

**成功响应：** `Result<PoolMemberResponse>`

**PoolMemberResponse 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | Long | 成员记录 ID |
| `poolId` | Long | 所属模型池 ID |
| `modelId` | Long | 模型记录 ID |
| `modelName` | String | 模型标识符名称 |
| `priority` | Integer | 优先级 |
| `weight` | Integer | 权重 |

### 7.7 移除池成员

#### `DELETE /api/admin/pools/{id}/members/{memberId}`

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | Long | 模型池 ID |
| `memberId` | Long | 成员记录 ID |

**成功响应：** `Result<Void>`

### 7.8 查询池成员列表

#### `GET /api/admin/pools/{id}/members`

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | Long | 模型池 ID |

**成功响应：** `Result<List<PoolMemberResponse>>`

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1892374650123458,
      "poolId": 1892374650123457,
      "modelId": 1892374650123456,
      "modelName": "gpt-4o-mini",
      "priority": 1,
      "weight": 10
    }
  ],
  "requestId": "..."
}
```

---

## 8. 限流管理接口

限流用于控制请求频率，支持租户级别和模型级别的限流配置。限流基于 Redis 滑动窗口算法实现。

### 8.1 创建限流规则

#### `POST /api/admin/rate-limits`

> 需要通过 `X-Tenant-Id` 请求头指定租户。

**请求体：**

```json
{
  "targetType": "TENANT",
  "targetId": "1001",
  "rpmLimit": 100,
  "tpmLimit": 100000
}
```

**请求字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `targetType` | String | **是** | 限流目标类型：`TENANT`（租户级别）或 `MODEL`（模型级别） |
| `targetId` | String | 否 | 限流目标 ID。`TENANT` 类型时为租户 ID，`MODEL` 类型时为模型标识符（如 `gpt-4o-mini`） |
| `rpmLimit` | Integer | 否 | 每分钟请求数上限（RPM） |
| `tpmLimit` | Long | 否 | 每分钟 Token 数上限（TPM） |

> `rpmLimit` 和 `tpmLimit` 至少设置一个。

**成功响应：** `Result<RateLimitResponse>`

**RateLimitResponse 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | Long | 限流规则 ID |
| `targetType` | String | 限流目标类型 |
| `targetId` | String | 限流目标 ID |
| `rpmLimit` | Integer | RPM 上限 |
| `tpmLimit` | Long | TPM 上限 |

### 8.2 查询限流规则列表

#### `GET /api/admin/rate-limits`

查询当前租户下的所有限流规则。

> 需要通过 `X-Tenant-Id` 请求头指定租户。

**请求参数：** 无

**成功响应：** `Result<List<RateLimitResponse>>`

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1892374650123459,
      "targetType": "TENANT",
      "targetId": "1001",
      "rpmLimit": 100,
      "tpmLimit": 100000
    },
    {
      "id": 1892374650123460,
      "targetType": "MODEL",
      "targetId": "gpt-4o-mini",
      "rpmLimit": 60,
      "tpmLimit": null
    }
  ],
  "requestId": "..."
}
```

### 8.3 删除限流规则

#### `DELETE /api/admin/rate-limits/{id}`

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | Long | 限流规则 ID |

**成功响应：** `Result<Void>`

---

## 9. Token 配额管理接口

Token 配额用于控制租户在一个计费周期内的总 Token 使用量。配额周期默认从当月 1 号开始。

### 9.1 创建配额

#### `POST /api/admin/quotas`

> 需要通过 `X-Tenant-Id` 请求头指定租户。

**请求体：**

```json
{
  "quotaType": "MONTHLY",
  "tokenLimit": 1000000
}
```

**请求字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `quotaType` | String | **是** | 配额类型：`MONTHLY`（月度）、`DAILY`（每日） |
| `tokenLimit` | Long | **是** | Token 上限数量 |

**成功响应：** `Result<QuotaResponse>`

**QuotaResponse 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | Long | 配额记录 ID |
| `tenantId` | Long | 租户 ID |
| `quotaType` | String | 配额类型 |
| `tokenLimit` | Long | Token 上限 |
| `tokensUsed` | Long | 已使用 Token 数量 |
| `periodStart` | String | 计费周期起始日期（格式 `yyyy-MM-dd`） |

### 9.2 查询配额列表

#### `GET /api/admin/quotas`

查询当前租户下的所有配额。

> 需要通过 `X-Tenant-Id` 请求头指定租户。

**请求参数：** 无

**成功响应：** `Result<List<QuotaResponse>>`

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1892374650123461,
      "tenantId": 1001,
      "quotaType": "MONTHLY",
      "tokenLimit": 1000000,
      "tokensUsed": 25430,
      "periodStart": "2026-03-01"
    }
  ],
  "requestId": "..."
}
```

### 9.3 删除配额

#### `DELETE /api/admin/quotas/{id}`

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | Long | 配额记录 ID |

**成功响应：** `Result<Void>`

### 9.4 重置配额

#### `POST /api/admin/quotas/{id}/reset`

将配额的已用 Token 数重置为 0，并将计费周期起始日期更新为当月 1 号。

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | Long | 配额记录 ID |

**请求体：** 无

**成功响应：** `Result<QuotaResponse>`

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1892374650123461,
    "tenantId": 1001,
    "quotaType": "MONTHLY",
    "tokenLimit": 1000000,
    "tokensUsed": 0,
    "periodStart": "2026-03-01"
  },
  "requestId": "..."
}
```

---

## 10. 用量统计接口

用量统计接口基于 `t_usage_record` 表实时查询，提供多维度的 Token 消耗和费用统计。

> 所有用量统计接口均需通过 `X-Tenant-Id` 请求头指定租户。

### 10.1 用量汇总

#### `GET /api/admin/usage/summary`

获取指定时间范围内的 Token 使用汇总。

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `start` | String | **是** | 起始日期，格式 `yyyy-MM-dd` |
| `end` | String | **是** | 结束日期，格式 `yyyy-MM-dd`（包含当天） |

**请求示例：**

```
GET /api/admin/usage/summary?start=2026-03-01&end=2026-03-10
```

**成功响应：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "promptTokens": 15000,
    "completionTokens": 8500,
    "totalTokens": 23500,
    "totalCost": 0.0235,
    "requestCount": 150
  },
  "requestId": "..."
}
```

**响应字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `promptTokens` | Long | 总输入 Token 数 |
| `completionTokens` | Long | 总输出 Token 数 |
| `totalTokens` | Long | 总 Token 数 |
| `totalCost` | BigDecimal | 总费用（美元） |
| `requestCount` | Long | 总请求数 |

### 10.2 按模型统计

#### `GET /api/admin/usage/by-model`

按模型维度统计 Token 使用情况。

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `start` | String | **是** | 起始日期，格式 `yyyy-MM-dd` |
| `end` | String | **是** | 结束日期，格式 `yyyy-MM-dd` |

**成功响应：**

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "modelId": "gpt-4o-mini",
      "totalTokens": 15000,
      "totalCost": 0.015,
      "requestCount": 100
    },
    {
      "modelId": "claude-3-haiku-20240307",
      "totalTokens": 8500,
      "totalCost": 0.0085,
      "requestCount": 50
    }
  ],
  "requestId": "..."
}
```

**响应列表元素字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `modelId` | String | 模型标识符 |
| `totalTokens` | Long | 总 Token 数 |
| `totalCost` | BigDecimal | 总费用 |
| `requestCount` | Long | 请求数 |

### 10.3 按 Provider 统计

#### `GET /api/admin/usage/by-provider`

按 Provider 维度统计 Token 使用情况。

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `start` | String | **是** | 起始日期，格式 `yyyy-MM-dd` |
| `end` | String | **是** | 结束日期，格式 `yyyy-MM-dd` |

**成功响应：**

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "providerType": "OPENAI",
      "totalTokens": 15000,
      "totalCost": 0.015,
      "requestCount": 100
    },
    {
      "providerType": "ANTHROPIC",
      "totalTokens": 8500,
      "totalCost": 0.0085,
      "requestCount": 50
    }
  ],
  "requestId": "..."
}
```

**响应列表元素字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `providerType` | String | Provider 类型 |
| `totalTokens` | Long | 总 Token 数 |
| `totalCost` | BigDecimal | 总费用 |
| `requestCount` | Long | 请求数 |

### 10.4 每日趋势

#### `GET /api/admin/usage/daily-trend`

获取每日 Token 使用趋势数据。

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `start` | String | **是** | 起始日期，格式 `yyyy-MM-dd` |
| `end` | String | **是** | 结束日期，格式 `yyyy-MM-dd` |

**成功响应：**

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "date": "2026-03-08",
      "totalTokens": 5000,
      "totalCost": 0.005,
      "requestCount": 30
    },
    {
      "date": "2026-03-09",
      "totalTokens": 8000,
      "totalCost": 0.008,
      "requestCount": 55
    },
    {
      "date": "2026-03-10",
      "totalTokens": 10500,
      "totalCost": 0.0105,
      "requestCount": 65
    }
  ],
  "requestId": "..."
}
```

**响应列表元素字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `date` | String | 日期 |
| `totalTokens` | Long | 当日总 Token 数 |
| `totalCost` | BigDecimal | 当日总费用 |
| `requestCount` | Long | 当日请求数 |

---

## 附录 A：模型路由说明

当客户端在 `/v1/chat/completions` 中传入 `model` 参数时，网关按以下优先级进行路由：

1. **直接模型匹配**：`model` 值与某个已注册模型的 `modelId` 精确匹配
2. **模型池匹配**：`model` 值与某个模型池的 `poolName` 匹配，按池的路由策略从成员中选择模型
3. **Auto 路由**：`model` 值为 `auto`，系统自动选择一个可用模型

路由策略说明：

| 策略 | 说明 |
|------|------|
| `ROUND_ROBIN` | 轮询，依次选择池中的每个成员 |
| `RANDOM` | 随机选择 |
| `PRIORITY` | 按优先级从高到低选择 |
| `WEIGHTED` | 按权重比例分配流量 |

## 附录 B：常见对接场景示例

### 场景一：基础对话

```bash
curl -X POST http://{host}:9202/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 1001" \
  -H "X-User-Id: 1" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "你好，请介绍一下自己。"}
    ]
  }'
```

### 场景二：使用模型池

```bash
curl -X POST http://{host}:9202/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 1001" \
  -d '{
    "model": "gpt-pool",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

### 场景三：自动路由

```bash
curl -X POST http://{host}:9202/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 1001" \
  -d '{
    "model": "auto",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

### 场景四：Function Calling

```bash
curl -X POST http://{host}:9202/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 1001" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "北京今天天气怎么样？"}
    ],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "get_weather",
          "description": "获取指定城市的天气信息",
          "parameters": {
            "type": "object",
            "properties": {
              "city": {
                "type": "string",
                "description": "城市名称"
              }
            },
            "required": ["city"]
          }
        }
      }
    ]
  }'
```

### 场景五：流式对话（前端 EventSource）

```javascript
const eventSource = new EventSource('/v1/chat/completions/stream?' + new URLSearchParams({
  // EventSource 只支持 GET，若需 POST 请使用 fetch + ReadableStream
}));

// 推荐使用 fetch API 进行 POST 流式请求（见 4.2 节示例代码）
```

## 附录 C：完整的管理流程

典型的管理配置流程：

```
1. 创建 Provider（配置 API Key 等）
   POST /api/admin/providers

2. 在 Provider 下创建模型
   POST /api/admin/providers/{providerId}/models

3. （可选）创建模型池并添加成员
   POST /api/admin/pools
   POST /api/admin/pools/{id}/members

4. （可选）配置限流规则
   POST /api/admin/rate-limits

5. （可选）配置 Token 配额
   POST /api/admin/quotas

6. 客户端即可通过 /v1/chat/completions 调用模型
```
