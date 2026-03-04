# ABC Platform API 参考文档

> 版本：v1 | 最后更新：2026-03-04

---

## 目录

- [1. 概述](#1-概述)
  - [1.1 基础 URL](#11-基础-url)
  - [1.2 认证方式](#12-认证方式)
  - [1.3 通用响应格式](#13-通用响应格式)
  - [1.4 通用请求头](#14-通用请求头)
  - [1.5 错误码说明](#15-错误码说明)
- [2. abc-auth — 认证与用户服务](#2-abc-auth--认证与用户服务)
  - [2.1 认证 (Auth)](#21-认证-auth)
  - [2.2 用户管理 (Users)](#22-用户管理-users)
  - [2.3 租户管理 (Tenants)](#23-租户管理-tenants)
  - [2.4 权限策略 (Policy)](#24-权限策略-policy)
- [3. abc-engine — 智能体引擎](#3-abc-engine--智能体引擎)
  - [3.1 任务 (Tasks)](#31-任务-tasks)
  - [3.2 对话 (Chat)](#32-对话-chat)
  - [3.3 智能体 (Agents)](#33-智能体-agents)
  - [3.4 Prompt 模板 (Prompts)](#34-prompt-模板-prompts)
  - [3.5 工作流 (Workflows)](#35-工作流-workflows)
  - [3.6 触发器 (Trigger)](#36-触发器-trigger)
  - [3.7 评测 (Eval)](#37-评测-eval)
  - [3.8 会话 (Conversations)](#38-会话-conversations)
  - [3.9 审批 (Approval)](#39-审批-approval)
  - [3.10 指标 (Metrics)](#310-指标-metrics)
  - [3.11 技能 (Skills)](#311-技能-skills)
  - [3.12 市场 (Marketplace)](#312-市场-marketplace)
  - [3.13 追踪 (Trace)](#313-追踪-trace)
- [4. abc-atlas — 记忆与知识服务](#4-abc-atlas--记忆与知识服务)
  - [4.1 记忆 (Memory)](#41-记忆-memory)
  - [4.2 知识库 (KB)](#42-知识库-kb)
- [5. abc-llm-gateway — 模型网关](#5-abc-llm-gateway--模型网关)
  - [5.1 模型调用 (Models)](#51-模型调用-models)
  - [5.2 供应商管理 (Providers)](#52-供应商管理-providers)
  - [5.3 模型池 (Pools)](#53-模型池-pools)
  - [5.4 路由规则 (Routing Rules)](#54-路由规则-routing-rules)
- [6. abc-mcp-gateway — MCP 工具网关](#6-abc-mcp-gateway--mcp-工具网关)
  - [6.1 工具 (Tools)](#61-工具-tools)
  - [6.2 MCP 服务器管理 (Servers)](#62-mcp-服务器管理-servers)
- [7. abc-channel-hub — 渠道集成](#7-abc-channel-hub--渠道集成)
- [8. abc-governance — 治理中心](#8-abc-governance--治理中心)
  - [8.1 标签 (Tags)](#81-标签-tags)
  - [8.2 资源组 (Groups)](#82-资源组-groups)
  - [8.3 能力注册 (Capabilities)](#83-能力注册-capabilities)
- [9. abc-license — 许可证服务](#9-abc-license--许可证服务)
- [10. Gateway 审计日志](#10-gateway-审计日志)

---

## 1. 概述

### 1.1 基础 URL

所有 API 通过统一网关访问：

```
http://<host>:8080/api/v1
```

网关将请求路由到后端微服务，并自动剥离前两段路径前缀（`/api/v1`）。

### 1.2 认证方式

| 方式 | Header | 说明 |
|------|--------|------|
| Bearer Token | `Authorization: Bearer <token>` | 通过 `/api/v1/auth/login` 获取 JWT Token |
| API Key | `X-API-Key: <key>` | 通过 `/api/v1/auth/api-keys` 创建 |

**公开接口**（无需认证）：
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`

### 1.3 通用响应格式

所有接口采用统一的 `Result` 包装：

**成功响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

**错误响应：**
```json
{
  "code": 40001,
  "message": "error description"
}
```

### 1.4 通用请求头

| Header | 必填 | 说明 |
|--------|------|------|
| `Authorization` | 是（公开接口除外） | `Bearer <token>` 或由网关注入 |
| `X-Tenant-Id` | 视接口而定 | 租户 ID，网关从 Token 中提取并注入 |
| `X-User-Id` | 视接口而定 | 用户 ID，网关从 Token 中提取并注入 |
| `Content-Type` | 是 | 通常为 `application/json` |

### 1.5 错误码说明

| 错误码范围 | 说明 |
|-----------|------|
| `0` | 成功 |
| `400` / `40000` | 请求参数错误 |
| `401` | 未认证 |
| `404` / `40400` | 资源不存在 |
| `409` | 资源冲突 |
| `429` | 请求频率超限 |
| `500` / `50000` | 服务内部错误 |

---

## 2. abc-auth — 认证与用户服务

> 后端端口 9101 | 网关路由：`/api/v1/auth/**`, `/api/v1/users/**`, `/api/v1/tenants/**`, `/api/v1/policy/**`

### 2.1 认证 (Auth)

#### 2.1.1 用户注册

```
POST /api/v1/auth/register
```

**公开接口，无需认证。**

请求体：
```json
{
  "tenantName": "my-company",
  "username": "admin",
  "password": "P@ssw0rd",
  "email": "admin@example.com"
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "userId": "usr_abc123",
    "tenantId": "tnt_xyz456",
    "username": "admin",
    "role": "admin"
  }
}
```

---

#### 2.1.2 用户登录

```
POST /api/v1/auth/login
```

**公开接口，无需认证。**

请求体：
```json
{
  "username": "admin",
  "password": "P@ssw0rd",
  "tenantId": "tnt_xyz456"
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "userId": "usr_abc123",
    "tenantId": "tnt_xyz456",
    "username": "admin",
    "role": "admin"
  }
}
```

---

#### 2.1.3 Token 验证

```
POST /api/v1/auth/validate
```

| Header | 必填 | 说明 |
|--------|------|------|
| `Authorization` | 是 | `Bearer <token>` |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "userId": "usr_abc123",
    "tenantId": "tnt_xyz456",
    "role": "admin"
  }
}
```

---

#### 2.1.4 验证 API Key

```
POST /api/v1/auth/api-key/verify
```

请求体：
```json
{
  "apiKey": "abk_xxxxxxxxxxxxxxxx"
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "tenantId": "tnt_xyz456",
    "name": "my-api-key",
    "valid": true
  }
}
```

---

#### 2.1.5 创建 API Key

```
POST /api/v1/auth/api-keys
```

请求体：
```json
{
  "tenantId": "tnt_xyz456",
  "name": "production-key",
  "expiresAt": "2027-01-01T00:00:00Z"
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "key_001",
    "apiKey": "abk_xxxxxxxxxxxxxxxx",
    "name": "production-key"
  }
}
```

---

#### 2.1.6 列出 API Key

```
GET /api/v1/auth/api-keys?tenantId=tnt_xyz456
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `tenantId` | 是 | 租户 ID |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "key_001",
      "name": "production-key",
      "maskedKey": "abk_****xxxx",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 2.1.7 撤销 API Key

```
DELETE /api/v1/auth/api-keys/{id}?tenantId=tnt_xyz456
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `id` | 是 | API Key ID (path) |
| `tenantId` | 是 | 租户 ID (query) |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

---

#### 2.1.8 OAuth2/OIDC — 列出已启用的 SSO 提供商

```
GET /api/v1/auth/oauth2/providers?tenantId=tnt_xyz456
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "oidc_001",
      "tenantId": "tnt_xyz456",
      "providerName": "google",
      "clientId": "xxx.apps.googleusercontent.com",
      "enabled": true
    }
  ]
}
```

---

#### 2.1.9 OAuth2/OIDC — 获取授权 URL

```
GET /api/v1/auth/oauth2/authorize?tenantId=tnt_xyz456&provider=google&redirectUri=https://app.example.com/callback&state=random_state
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `tenantId` | 是 | 租户 ID |
| `provider` | 是 | 提供商名称 |
| `redirectUri` | 是 | 回调地址 |
| `state` | 否 | 状态参数 |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
  }
}
```

---

#### 2.1.10 OAuth2/OIDC — 回调处理

```
POST /api/v1/auth/oauth2/callback?tenantId=tnt_xyz456&provider=google&code=AUTH_CODE&redirectUri=https://app.example.com/callback
```

响应：与登录响应格式相同。

---

#### 2.1.11 OAuth2/OIDC — 创建提供商配置

```
POST /api/v1/auth/oauth2/providers
```

请求体：
```json
{
  "tenantId": "tnt_xyz456",
  "providerName": "google",
  "clientId": "xxx.apps.googleusercontent.com",
  "clientSecret": "secret",
  "authorizationUri": "https://accounts.google.com/o/oauth2/v2/auth",
  "tokenUri": "https://oauth2.googleapis.com/token",
  "userInfoUri": "https://www.googleapis.com/oauth2/v3/userinfo",
  "scopes": "openid,profile,email",
  "enabled": true
}
```

---

#### 2.1.12 OAuth2/OIDC — 更新提供商配置

```
PUT /api/v1/auth/oauth2/providers/{id}
```

请求体同创建。

---

#### 2.1.13 OAuth2/OIDC — 删除提供商配置

```
DELETE /api/v1/auth/oauth2/providers/{id}
```

---

#### 2.1.14 OAuth2/OIDC — 列出所有提供商（含已禁用）

```
GET /api/v1/auth/oauth2/providers/all?tenantId=tnt_xyz456
```

---

### 2.2 用户管理 (Users)

#### 2.2.1 列出用户

```
GET /api/v1/users
```

| Header / 参数 | 必填 | 说明 |
|--------------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |
| `status` | 否 | 按状态过滤（`active`, `disabled`） |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "usr_abc123",
      "tenantId": "tnt_xyz456",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "status": "active",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 2.2.2 获取用户详情

```
GET /api/v1/users/{id}
```

---

#### 2.2.3 获取当前用户信息

```
GET /api/v1/users/me
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-User-Id` | 是 | 用户 ID（网关自动注入） |

---

#### 2.2.4 邀请用户

```
POST /api/v1/users/invite
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

请求体：
```json
{
  "username": "newuser",
  "password": "P@ssw0rd",
  "email": "newuser@example.com",
  "role": "developer"
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "usr_new001",
    "tenantId": "tnt_xyz456",
    "username": "newuser",
    "email": "newuser@example.com",
    "role": "developer",
    "status": "active"
  }
}
```

---

#### 2.2.5 更新用户

```
PUT /api/v1/users/{id}
```

请求体（部分更新）：
```json
{
  "email": "newemail@example.com",
  "role": "admin",
  "password": "NewP@ssw0rd"
}
```

---

#### 2.2.6 禁用用户

```
DELETE /api/v1/users/{id}
```

说明：将用户状态设为 `disabled`，不会物理删除。

---

### 2.3 租户管理 (Tenants)

#### 2.3.1 列出租户

```
GET /api/v1/tenants
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `status` | 否 | 按状态过滤 |
| `keyword` | 否 | 按名称搜索 |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "tnt_xyz456",
      "name": "my-company",
      "plan": "pro",
      "status": "active",
      "config": "{}",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 2.3.2 获取租户详情

```
GET /api/v1/tenants/{id}
```

---

#### 2.3.3 创建租户

```
POST /api/v1/tenants
```

请求体：
```json
{
  "name": "new-company",
  "plan": "pro",
  "config": "{}"
}
```

---

#### 2.3.4 更新租户

```
PUT /api/v1/tenants/{id}
```

请求体（部分更新）：
```json
{
  "name": "updated-name",
  "plan": "enterprise",
  "config": "{\"maxAgents\": 100}",
  "status": "active"
}
```

---

#### 2.3.5 冻结租户

```
POST /api/v1/tenants/{id}/freeze
```

说明：将租户状态设为 `frozen`。

---

#### 2.3.6 解冻租户

```
POST /api/v1/tenants/{id}/unfreeze
```

说明：将租户状态恢复为 `active`。

---

### 2.4 权限策略 (Policy)

#### 2.4.1 权限检查

```
POST /api/v1/policy/check
```

请求体：
```json
{
  "tenantId": "tnt_xyz456",
  "userId": "usr_abc123",
  "role": "developer",
  "resource": "agent",
  "action": "create"
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "allowed": true,
    "reason": "role_permission_match"
  }
}
```

---

#### 2.4.2 列出策略

```
GET /api/v1/policy/policies?tenantId=tnt_xyz456
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `tenantId` | 是 | 租户 ID |
| `status` | 否 | 按状态过滤 |
| `resourceType` | 否 | 按资源类型过滤 |

---

#### 2.4.3 创建策略

```
POST /api/v1/policy/policies
```

请求体：
```json
{
  "tenantId": "tnt_xyz456",
  "name": "agent-access-policy",
  "description": "Control agent CRUD access",
  "policyType": "rbac",
  "rules": "{\"allow\": [\"admin\", \"developer\"]}",
  "resourceType": "agent",
  "status": "active"
}
```

---

#### 2.4.4 更新策略

```
PUT /api/v1/policy/policies/{id}
```

---

#### 2.4.5 删除策略

```
DELETE /api/v1/policy/policies/{id}
```

---

#### 2.4.6 列出角色权限

```
GET /api/v1/policy/role-permissions?tenantId=tnt_xyz456&role=developer
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `tenantId` | 是 | 租户 ID |
| `role` | 否 | 按角色过滤 |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "rp_001",
      "tenantId": "tnt_xyz456",
      "role": "developer",
      "resource": "agent",
      "action": "read",
      "effect": "allow"
    }
  ]
}
```

---

#### 2.4.7 创建角色权限

```
POST /api/v1/policy/role-permissions
```

请求体：
```json
{
  "tenantId": "tnt_xyz456",
  "role": "developer",
  "resource": "agent",
  "action": "create",
  "effect": "allow"
}
```

---

## 3. abc-engine — 智能体引擎

> 后端端口 9001 | 网关路由：`/api/v1/tasks/**`, `/api/v1/chat/**`, `/api/v1/agents/**` 等

### 3.1 任务 (Tasks)

#### 3.1.1 创建任务

```
POST /api/v1/tasks
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

请求体：
```json
{
  "agentId": "agent_001",
  "sessionId": "sess_optional",
  "message": "帮我总结这份文档"
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "taskId": "task_abc123",
    "sessionId": "sess_xyz456"
  }
}
```

---

#### 3.1.2 获取任务详情

```
GET /api/v1/tasks/{id}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "task_abc123",
    "agentId": "agent_001",
    "tenantId": "tnt_xyz456",
    "sessionId": "sess_xyz456",
    "status": "COMPLETED",
    "input": "帮我总结这份文档",
    "output": "文档主要包含三个部分...",
    "createdAt": "2026-03-04T10:00:00Z",
    "updatedAt": "2026-03-04T10:00:05Z"
  }
}
```

---

#### 3.1.3 恢复任务

```
POST /api/v1/tasks/{id}/resume
```

请求体（可选）：
```json
{
  "userInput": "确认继续执行"
}
```

说明：恢复处于等待人工确认（HITL）状态的任务。

---

#### 3.1.4 任务事件流 (SSE)

```
GET /api/v1/tasks/{id}/events
```

**SSE 流式接口**，返回 `text/event-stream`。

事件格式：
```
id: evt_001
event: THINKING
data: {"eventId":"evt_001","type":"THINKING","taskId":"task_abc123","payload":"..."}

id: evt_002
event: TOOL_CALL
data: {"eventId":"evt_002","type":"TOOL_CALL","taskId":"task_abc123","payload":"..."}

id: evt_003
event: TEXT_CHUNK
data: {"eventId":"evt_003","type":"TEXT_CHUNK","taskId":"task_abc123","payload":"部分文本..."}

id: evt_004
event: COMPLETED
data: {"eventId":"evt_004","type":"COMPLETED","taskId":"task_abc123","payload":"完整结果..."}
```

事件类型：`THINKING`, `TOOL_CALL`, `TOOL_RESULT`, `TEXT_CHUNK`, `COMPLETED`, `FAILED`, `APPROVAL_REQUIRED`

---

#### 3.1.5 多智能体移交 (Handoff)

```
POST /api/v1/handoff
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

请求体：
```json
{
  "fromTaskId": "task_abc123",
  "targetAgentId": "agent_002",
  "message": "请帮我处理翻译任务"
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "taskId": "task_def456",
    "sessionId": "sess_xyz456"
  }
}
```

---

### 3.2 对话 (Chat)

#### 3.2.1 流式对话 (SSE)

```
POST /api/v1/chat
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |
| `X-User-Id` | 否 | 用户 ID |

请求体：
```json
{
  "agentId": "agent_001",
  "sessionId": "sess_optional",
  "message": "你好，请介绍一下自己"
}
```

**SSE 流式接口**，返回 `text/event-stream`。

事件格式：
```
event: INIT
data: {"taskId":"task_abc123","sessionId":"sess_xyz456"}

id: evt_001
event: TEXT_CHUNK
data: {"eventId":"evt_001","type":"TEXT_CHUNK","payload":"你好！我是..."}

id: evt_002
event: COMPLETED
data: {"eventId":"evt_002","type":"COMPLETED","payload":"..."}
```

首个事件为 `INIT`，包含 `taskId` 和 `sessionId`，随后按 Task 事件格式推送。

---

### 3.3 智能体 (Agents)

#### 3.3.1 列出智能体

```
GET /api/v1/agents
```

| Header / 参数 | 必填 | 说明 |
|--------------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |
| `tag` | 否 | 按标签过滤 |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "agent_001",
      "tenantId": "tnt_xyz456",
      "name": "文档助手",
      "description": "帮助用户处理文档相关任务",
      "driver": "react",
      "modelId": "gpt-4o",
      "systemPrompt": "你是一个文档处理助手...",
      "temperature": 0.7,
      "maxTokens": 4096,
      "toolIds": "search,summarize",
      "tags": "document,assistant",
      "category": "productivity",
      "visibility": "private",
      "status": "active",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 3.3.2 获取智能体详情

```
GET /api/v1/agents/{id}
```

---

#### 3.3.3 创建智能体

```
POST /api/v1/agents
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

请求体：
```json
{
  "name": "翻译助手",
  "description": "多语言翻译智能体",
  "driver": "react",
  "modelId": "gpt-4o",
  "systemPrompt": "你是一个专业翻译...",
  "temperature": 0.3,
  "maxTokens": 2048,
  "toolIds": "translate",
  "tags": "translation",
  "category": "language",
  "visibility": "private"
}
```

---

#### 3.3.4 更新智能体

```
PUT /api/v1/agents/{id}
```

请求体（部分更新）：
```json
{
  "name": "新名称",
  "systemPrompt": "更新后的提示词",
  "temperature": 0.5
}
```

---

#### 3.3.5 删除智能体

```
DELETE /api/v1/agents/{id}
```

说明：将状态设为 `archived`，不物理删除。

---

#### 3.3.6 智能体进化 (Evolve)

```
POST /api/v1/agents/{id}/evolve
```

请求体：
```json
{
  "proposalType": "prompt_mutation",
  "proposedValue": "你是一个经过优化的文档处理助手...",
  "proposalId": "proposal_001"
}
```

`proposalType` 可选值：
- `prompt_mutation`：修改 systemPrompt
- `param_tuning`：调整参数（`proposedValue` 为 JSON 格式：`{"temperature": 0.5, "maxTokens": 2048, "modelId": "gpt-4o"}`）
- `tool_adjustment`：调整工具列表

---

### 3.4 Prompt 模板 (Prompts)

#### 3.4.1 创建模板

```
POST /api/v1/prompts/templates
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

请求体：
```json
{
  "name": "summarizer",
  "content": "请对以下内容进行摘要：\n{{text}}",
  "category": "general",
  "createdBy": "admin"
}
```

---

#### 3.4.2 列出模板

```
GET /api/v1/prompts/templates
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

---

#### 3.4.3 获取模板详情

```
GET /api/v1/prompts/templates/{id}
```

响应包含模板信息及所有版本。

---

#### 3.4.4 创建模板版本

```
POST /api/v1/prompts/templates/{id}/versions
```

请求体：
```json
{
  "content": "请对以下内容进行精简摘要：\n{{text}}",
  "changelog": "优化了摘要质量",
  "author": "admin"
}
```

---

#### 3.4.5 部署模板版本

```
POST /api/v1/prompts/templates/{id}/deploy
```

请求体：
```json
{
  "versionId": "ver_001",
  "environment": "production",
  "deployedBy": "admin"
}
```

---

#### 3.4.6 回滚模板版本

```
POST /api/v1/prompts/templates/{id}/rollback
```

请求体：
```json
{
  "environment": "production",
  "deployedBy": "admin"
}
```

---

#### 3.4.7 解析模板（获取当前生效内容）

```
GET /api/v1/prompts/templates/resolve?templateId=tpl_001&environment=production
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `templateId` | 是 | 模板 ID |
| `environment` | 是 | 环境名称（`production`, `staging` 等） |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": "请对以下内容进行精简摘要：\n{{text}}"
}
```

---

### 3.5 工作流 (Workflows)

#### 3.5.1 创建工作流

```
POST /api/v1/workflows
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

请求体：
```json
{
  "name": "数据处理流水线",
  "description": "自动化数据清洗和分析",
  "definition": "{\"steps\": [{\"type\": \"agent\", \"agentId\": \"agent_001\"}]}"
}
```

---

#### 3.5.2 列出工作流

```
GET /api/v1/workflows
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

---

#### 3.5.3 获取工作流详情

```
GET /api/v1/workflows/{id}
```

---

#### 3.5.4 更新工作流

```
PUT /api/v1/workflows/{id}
```

---

#### 3.5.5 删除工作流

```
DELETE /api/v1/workflows/{id}
```

---

#### 3.5.6 执行工作流

```
POST /api/v1/workflows/{id}/run
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

请求体（可选）：
```json
{
  "inputs": {
    "data": "input data content"
  }
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "run_001",
    "workflowId": "wf_001",
    "status": "RUNNING",
    "inputs": "...",
    "createdAt": "2026-03-04T10:00:00Z"
  }
}
```

---

#### 3.5.7 列出工作流运行记录

```
GET /api/v1/workflows/{id}/runs
```

---

#### 3.5.8 获取运行详情

```
GET /api/v1/workflows/runs/{runId}
```

---

### 3.6 触发器 (Trigger)

#### 3.6.1 Webhook 触发

```
POST /api/v1/trigger/webhook
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |
| `X-Webhook-Secret` | 否 | Webhook 密钥（配置后必填） |

**触发工作流：**
```json
{
  "workflowId": "wf_001",
  "inputs": {
    "key": "value"
  }
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "type": "workflow_run",
    "workflowId": "wf_001",
    "runId": "run_001"
  }
}
```

**触发智能体任务：**
```json
{
  "agentId": "agent_001",
  "message": "处理新的客户请求"
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "type": "task",
    "taskId": "task_001",
    "sessionId": "sess_001"
  }
}
```

---

### 3.7 评测 (Eval)

#### 3.6.1 创建评测数据集

```
POST /api/v1/eval/datasets
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |
| `X-User-Id` | 否 | 用户 ID |

请求体：
```json
{
  "name": "QA 测试集",
  "description": "问答质量评测数据集",
  "type": "qa"
}
```

---

#### 3.6.2 列出数据集

```
GET /api/v1/eval/datasets
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

---

#### 3.6.3 获取数据集详情（含数据项）

```
GET /api/v1/eval/datasets/{id}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "dataset": { "id": "ds_001", "name": "QA 测试集", ... },
    "items": [
      { "id": "item_001", "input": "{...}", "expected": "{...}" }
    ]
  }
}
```

---

#### 3.6.4 添加数据项

```
POST /api/v1/eval/datasets/{id}/items
```

请求体：
```json
{
  "input": { "question": "什么是 RAG？" },
  "expected": { "answer": "检索增强生成..." },
  "metadata": { "category": "knowledge" }
}
```

---

#### 3.6.5 批量导入数据项

```
POST /api/v1/eval/datasets/{id}/import
```

请求体：
```json
{
  "items": [
    { "input": "{...}", "expected": "{...}" },
    { "input": "{...}", "expected": "{...}" }
  ]
}
```

---

#### 3.6.6 启动评测运行

```
POST /api/v1/eval/runs
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |
| `X-User-Id` | 否 | 用户 ID |

请求体：
```json
{
  "datasetId": "ds_001",
  "agentId": "agent_001",
  "config": {
    "metrics": ["accuracy", "relevance", "latency"]
  }
}
```

---

#### 3.6.7 列出评测运行

```
GET /api/v1/eval/runs
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

---

#### 3.6.8 获取评测运行详情

```
GET /api/v1/eval/runs/{id}
```

---

#### 3.6.9 获取评测运行结果

```
GET /api/v1/eval/runs/{id}/results
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "result_001",
      "runId": "run_001",
      "datasetItemId": "item_001",
      "actual": "检索增强生成是...",
      "scores": "{\"accuracy\": 0.9, \"relevance\": 0.85}",
      "passed": true
    }
  ]
}
```

---

#### 3.6.10 回归测试

```
POST /api/v1/eval/regression?datasetId=ds_001&agentId=agent_001&minScore=6.0&maxWaitSeconds=300
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

| 参数 | 必填 | 说明 |
|------|------|------|
| `datasetId` | 是 | 数据集 ID |
| `agentId` | 是 | 智能体 ID |
| `minScore` | 否 | 最低通过分数（默认 6.0） |
| `maxWaitSeconds` | 否 | 最大等待时间秒（默认 300） |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "passed": true,
    "overallScore": 8.5,
    "runId": "run_001"
  }
}
```

说明：用于 CI/CD 流水线中阻止质量不达标的发布。

---

#### 3.6.11 A/B 对比测试

```
POST /api/v1/eval/compare?datasetId=ds_001&agentIdA=agent_001&agentIdB=agent_002&maxWaitSeconds=600
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "runIdA": "run_001",
    "runIdB": "run_002",
    "overallA": 8.5,
    "overallB": 7.2,
    "winner": "A"
  }
}
```

---

#### 3.6.12 在线评分

```
POST /api/v1/eval/score
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

请求体：
```json
{
  "agentId": "agent_001",
  "input": { "question": "什么是 RAG？" },
  "expected": { "answer": "检索增强生成..." },
  "actual": "RAG 是一种结合检索和生成的技术..."
}
```

说明：`actual` 可省略，系统会自动执行任务获取实际输出。

---

#### 3.6.13 提交用户反馈

```
POST /api/v1/eval/feedback
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |
| `X-User-Id` | 否 | 用户 ID |

请求体：
```json
{
  "taskId": "task_001",
  "sessionId": "sess_001",
  "agentId": "agent_001",
  "rating": "thumbs_up",
  "comment": "回答很准确"
}
```

`rating` 可选值：`thumbs_up`, `thumbs_down`

---

#### 3.6.14 获取反馈统计

```
GET /api/v1/eval/feedback?agentId=agent_001
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "agentId": "agent_001",
    "thumbsUp": 42,
    "thumbsDown": 3,
    "total": 45,
    "satisfactionRate": 93.33
  }
}
```

---

#### 3.6.15 列出反馈详情

```
GET /api/v1/eval/feedback/list?agentId=agent_001
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

---

### 3.8 会话 (Conversations)

#### 3.6.1 创建会话

```
POST /api/v1/conversations
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |
| `X-User-Id` | 否 | 用户 ID |

请求体：
```json
{
  "agentId": "agent_001",
  "title": "文档分析会话"
}
```

---

#### 3.6.2 列出会话

```
GET /api/v1/conversations
```

| Header / 参数 | 必填 | 说明 |
|--------------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |
| `agentId` | 否 | 按智能体过滤 |
| `userId` | 否 | 按用户过滤 |
| `keyword` | 否 | 关键词搜索 |

---

#### 3.6.3 获取会话详情

```
GET /api/v1/conversations/{id}
```

---

#### 3.6.4 重命名会话

```
PUT /api/v1/conversations/{id}
```

请求体：
```json
{
  "title": "新标题"
}
```

---

#### 3.6.5 删除会话

```
DELETE /api/v1/conversations/{id}
```

---

### 3.9 审批 (Approval)

#### 3.6.1 提交审批请求

```
POST /api/v1/approval/request
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |
| `X-User-Id` | 是 | 发起者用户 ID |

请求体：
```json
{
  "resourceId": "agent_001",
  "resourceType": "agent",
  "action": "deploy_to_production",
  "requestData": "{\"version\": \"v2.0\"}"
}
```

---

#### 3.6.2 获取审批请求详情

```
GET /api/v1/approval/request/{id}
```

---

#### 3.6.3 列出待审批请求

```
GET /api/v1/approval/pending
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

---

#### 3.6.4 列出我的审批请求

```
GET /api/v1/approval/my-requests
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-User-Id` | 是 | 用户 ID |

---

#### 3.6.5 批准请求

```
POST /api/v1/approval/{id}/approve
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-User-Id` | 是 | 审批者用户 ID |

请求体（可选）：
```json
{
  "reason": "审核通过"
}
```

---

#### 3.6.6 拒绝请求

```
POST /api/v1/approval/{id}/reject
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-User-Id` | 是 | 审批者用户 ID |

请求体：
```json
{
  "reason": "不符合安全规范"
}
```

---

#### 3.6.7 列出审批策略

```
GET /api/v1/approval/policies
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

---

#### 3.6.8 创建审批策略

```
POST /api/v1/approval/policies
```

请求体：
```json
{
  "tenantId": "tnt_xyz456",
  "resourceType": "agent",
  "action": "deploy_to_production",
  "requiredApprovers": 2,
  "approverRoles": "admin,reviewer"
}
```

---

#### 3.6.9 更新审批策略

```
PUT /api/v1/approval/policies/{id}
```

---

#### 3.6.10 删除审批策略

```
DELETE /api/v1/approval/policies/{id}
```

---

### 3.10 指标 (Metrics)

#### 3.6.1 概览统计

```
GET /api/v1/metrics/summary
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 否 | 按租户过滤（不传则全局统计） |

响应：
```json
{
  "totalTasks": 1500,
  "tasksCompleted": 1200,
  "tasksFailed": 50,
  "tasksRunning": 10,
  "activeAgents": 25,
  "totalWorkflowRuns": 300
}
```

> 注意：此接口直接返回 JSON 对象，不使用 Result 包装。

---

#### 3.6.2 近期任务统计

```
GET /api/v1/metrics/recent?hours=24
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 否 | 按租户过滤 |

| 参数 | 必填 | 说明 |
|------|------|------|
| `hours` | 否 | 统计时间范围（小时），默认 24 |

响应：
```json
{
  "tasksLast24h": 120
}
```

> 注意：此接口直接返回 JSON 对象，不使用 Result 包装。

---

#### 3.6.3 热门智能体排行

```
GET /api/v1/metrics/top-agents?limit=10
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 否 | 按租户过滤 |

| 参数 | 必填 | 说明 |
|------|------|------|
| `limit` | 否 | 返回数量，默认 10 |

响应：
```json
[
  { "agentId": "agent_001", "taskCount": 500 },
  { "agentId": "agent_002", "taskCount": 300 }
]
```

> 注意：此接口直接返回 JSON 数组，不使用 Result 包装。

---

### 3.11 技能 (Skills)

#### 3.6.1 列出技能

```
GET /api/v1/skills
```

| Header / 参数 | 必填 | 说明 |
|--------------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |
| `category` | 否 | 按类别过滤 |

---

#### 3.6.2 获取技能详情

```
GET /api/v1/skills/{id}
```

---

#### 3.6.3 创建技能

```
POST /api/v1/skills
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

请求体：
```json
{
  "name": "web-search",
  "description": "网页搜索能力",
  "category": "search",
  "config": "{}",
  "status": "active"
}
```

---

#### 3.6.4 更新技能

```
PUT /api/v1/skills/{id}
```

---

#### 3.6.5 删除技能

```
DELETE /api/v1/skills/{id}
```

说明：将状态设为 `archived`。

---

### 3.12 市场 (Marketplace)

#### 3.6.1 浏览市场智能体

```
GET /api/v1/marketplace/agents
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `category` | 否 | 按类别过滤 |
| `keyword` | 否 | 关键词搜索 |

---

#### 3.6.2 浏览模板

```
GET /api/v1/marketplace/templates
```

---

#### 3.6.3 从模板克隆智能体

```
POST /api/v1/marketplace/templates/{id}/clone
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

请求体（可选）：
```json
{
  "name": "我的自定义助手"
}
```

---

#### 3.6.4 获取收藏列表

```
GET /api/v1/marketplace/favorites
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-User-Id` | 是 | 用户 ID |

---

#### 3.6.5 添加收藏

```
POST /api/v1/marketplace/favorites/{agentId}
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-User-Id` | 是 | 用户 ID |

---

#### 3.6.6 取消收藏

```
DELETE /api/v1/marketplace/favorites/{agentId}
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-User-Id` | 是 | 用户 ID |

---

### 3.13 追踪 (Trace)

#### 3.6.1 追踪任务

```
GET /api/v1/trace/tasks/{taskId}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "task": { "id": "task_001", "status": "COMPLETED", ... },
    "events": [
      { "id": 1, "taskId": "task_001", "type": "THINKING", "payload": "...", ... },
      { "id": 2, "taskId": "task_001", "type": "TOOL_CALL", "payload": "...", ... }
    ],
    "eventCount": 2
  }
}
```

---

#### 3.6.2 追踪会话

```
GET /api/v1/trace/sessions/{sessionId}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "sessionId": "sess_001",
    "taskCount": 3,
    "tasks": [
      {
        "task": { "id": "task_001", ... },
        "events": [ ... ],
        "eventCount": 5
      }
    ]
  }
}
```

---

## 4. abc-atlas — 记忆与知识服务

> 后端端口 9201 | 网关路由：`/api/v1/memory/**`, `/api/v1/kb/**`

### 4.1 记忆 (Memory)

#### 4.1.1 存储记忆

```
POST /api/v1/memory/remember
```

请求体：
```json
{
  "tenantId": "tnt_xyz456",
  "namespace": "user:usr_001",
  "content": "用户偏好：喜欢简洁的回答",
  "metadata": "{\"source\": \"conversation\"}"
}
```

---

#### 4.1.2 召回记忆

```
POST /api/v1/memory/recall
```

请求体：
```json
{
  "tenantId": "tnt_xyz456",
  "namespace": "user:usr_001",
  "query": "用户有什么偏好？",
  "topK": 5
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "mem_001",
      "content": "用户偏好：喜欢简洁的回答",
      "score": 0.92,
      "metadata": "{\"source\": \"conversation\"}"
    }
  ]
}
```

---

#### 4.1.3 获取最近记忆

```
GET /api/v1/memory/recent?tenantId=tnt_xyz456&namespace=user:usr_001&limit=10
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `tenantId` | 是 | 租户 ID |
| `namespace` | 是 | 命名空间 |
| `limit` | 否 | 数量限制，默认 10，最大 50 |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    { "content": "...", "createdAt": "2026-03-04T09:00:00Z" },
    { "content": "...", "createdAt": "2026-03-04T09:05:00Z" }
  ]
}
```

---

#### 4.1.4 摘要并存储

```
POST /api/v1/memory/summarize-and-remember
```

请求体：
```json
{
  "tenantId": "tnt_xyz456",
  "namespace": "session:sess_001",
  "contents": [
    "第一轮对话内容...",
    "第二轮对话内容...",
    "第三轮对话内容..."
  ]
}
```

说明：通过 LLM 对多条内容生成摘要后存入记忆。

---

#### 4.1.5 遗忘记忆

```
DELETE /api/v1/memory/forget
```

请求体：
```json
{
  "tenantId": "tnt_xyz456",
  "namespace": "user:usr_001",
  "key": "mem_001"
}
```

---

#### 4.1.6 遗忘用户所有记忆 (GDPR)

```
DELETE /api/v1/memory/user/{userId}?tenantId=tnt_xyz456
```

说明：符合 GDPR 要求，删除用户的全部记忆数据（Profile + 向量记忆）。

---

#### 4.1.7 删除指定向量记忆

```
DELETE /api/v1/memory/vector/{id}?tenantId=tnt_xyz456
```

---

#### 4.1.8 获取用户画像

```
GET /api/v1/memory/profile/{userId}?tenantId=tnt_xyz456
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "language": "zh-CN",
    "preferredStyle": "concise",
    "expertise": "software engineering"
  }
}
```

---

#### 4.1.9 设置用户画像属性

```
PUT /api/v1/memory/profile/{userId}
```

请求体：
```json
{
  "tenantId": "tnt_xyz456",
  "key": "language",
  "value": "zh-CN"
}
```

---

#### 4.1.10 整合记忆 (Consolidate)

```
POST /api/v1/memory/consolidate
```

请求体：
```json
{
  "tenantId": "tnt_xyz456",
  "userId": "usr_001",
  "transcript": [
    "用户：我需要英文翻译",
    "助手：好的，请提供需要翻译的内容",
    "用户：我主要做 Java 开发"
  ]
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "profile": { "language": "zh-CN", "expertise": "Java development" },
    "facts": ["用户需要英文翻译服务", "用户是 Java 开发者"]
  }
}
```

说明：从对话记录中提取用户画像和事实，更新到 KV 存储和向量数据库。

---

#### 4.1.11 会话结束自动整合

```
POST /api/v1/memory/consolidate-session
```

请求体：
```json
{
  "tenantId": "tnt_xyz456",
  "namespace": "session:sess_001",
  "userId": "usr_001",
  "maxTurns": 50
}
```

说明：自动获取最近对话轮次并执行整合。适合在会话结束时调用。

---

#### 4.1.12 查看整合日志

```
GET /api/v1/memory/consolidation-logs?tenantId=tnt_xyz456&userId=usr_001&limit=20
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `tenantId` | 是 | 租户 ID |
| `userId` | 否 | 按用户过滤 |
| `limit` | 否 | 数量限制，默认 20 |

---

#### 4.1.13 添加图谱三元组

```
POST /api/v1/memory/graph/triple
```

请求体：
```json
{
  "tenantId": "tnt_xyz456",
  "namespace": "user:usr_001",
  "subject": "用户",
  "predicate": "偏好",
  "object": "简洁回答"
}
```

---

#### 4.1.14 查询图谱三元组

```
GET /api/v1/memory/graph/triples?tenantId=tnt_xyz456&namespace=user:usr_001&subject=用户
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `tenantId` | 是 | 租户 ID |
| `namespace` | 是 | 命名空间 |
| `subject` | 否 | 按主体过滤 |

---

#### 4.1.15 删除图谱

```
DELETE /api/v1/memory/graph?tenantId=tnt_xyz456&namespace=user:usr_001
```

---

### 4.2 知识库 (KB)

#### 4.2.1 创建知识库

```
POST /api/v1/kb
```

请求体：
```json
{
  "tenantId": "tnt_xyz456",
  "name": "产品手册",
  "description": "公司产品文档知识库"
}
```

---

#### 4.2.2 列出知识库

```
GET /api/v1/kb?tenantId=tnt_xyz456
```

---

#### 4.2.3 获取知识库详情

```
GET /api/v1/kb/{id}
```

---

#### 4.2.4 删除知识库

```
DELETE /api/v1/kb/{id}
```

---

#### 4.2.5 上传文档（文本方式）

```
POST /api/v1/kb/{id}/documents
```

请求体：
```json
{
  "name": "产品介绍",
  "text": "ABC Platform 是一个企业级 AI 智能体平台...",
  "chunkStrategy": "simple"
}
```

`chunkStrategy` 可选值：
- `simple`（默认）：简单分块
- `parent_child`：父子索引分块

---

#### 4.2.6 上传文档（文件方式）

```
POST /api/v1/kb/{id}/documents/upload
Content-Type: multipart/form-data
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `file` | 是 | 文件（支持 PDF, Word, HTML 等） |
| `chunkStrategy` | 否 | 分块策略，默认 `simple` |

---

#### 4.2.7 列出文档

```
GET /api/v1/kb/{id}/documents
```

---

#### 4.2.8 获取文档详情

```
GET /api/v1/kb/{id}/documents/{docId}
```

---

#### 4.2.9 删除文档

```
DELETE /api/v1/kb/{id}/documents/{docId}
```

---

#### 4.2.10 知识库搜索

```
POST /api/v1/kb/{id}/search
```

请求体：
```json
{
  "query": "如何配置智能体？",
  "topK": 5,
  "minScore": 0.5,
  "hybrid": true,
  "rewriteQuery": true,
  "useRerank": true,
  "useGraph": false
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `query` | 是 | 搜索查询 |
| `topK` | 否 | 返回结果数 |
| `minScore` | 否 | 最低相关性分数 |
| `hybrid` | 否 | 是否启用混合搜索（向量 + 关键词） |
| `rewriteQuery` | 否 | 是否启用查询重写 |
| `useRerank` | 否 | 是否启用重排序 |
| `useGraph` | 否 | 是否启用 GraphRAG 增强 |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "results": [
      {
        "chunkId": "chunk_001",
        "content": "智能体配置步骤如下...",
        "score": 0.95,
        "documentId": "doc_001",
        "documentName": "产品手册"
      }
    ],
    "rewrittenQuery": "智能体配置方法和步骤"
  }
}
```

---

#### 4.2.11 获取知识图谱

```
GET /api/v1/kb/{id}/graph
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "kbId": "kb_001",
    "tripleCount": 150,
    "triples": [
      { "subject": "ABC Platform", "predicate": "包含", "object": "智能体引擎" }
    ]
  }
}
```

> 当三元组数量超过 500 时不返回 `triples` 字段。

---

#### 4.2.12 图谱搜索

```
POST /api/v1/kb/{id}/graph/search
```

请求体：
```json
{
  "query": "ABC Platform 的核心组件",
  "maxHops": 2
}
```

---

## 5. abc-llm-gateway — 模型网关

> 后端端口 9102 | 网关路由：`/api/v1/models/**`

### 5.1 模型调用 (Models)

#### 5.1.1 流式对话补全 (SSE)

```
POST /api/v1/models/chat/completions
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 否 | 租户 ID（用于计费和限流） |
| `X-User-Id` | 否 | 用户 ID |

请求体：
```json
{
  "model": "gpt-4o",
  "messages": [
    { "role": "system", "content": "你是一个有用的助手" },
    { "role": "user", "content": "你好" }
  ],
  "stream": true,
  "temperature": 0.7,
  "maxTokens": 2048
}
```

**SSE 流式接口**（`stream: true`），返回 `text/event-stream`。

事件格式（兼容 OpenAI）：
```
data: {"choices":[{"delta":{"content":"你"},"index":0}]}

data: {"choices":[{"delta":{"content":"好"},"index":0}]}

data: [DONE]
```

当 `stream: false` 时，一次性返回完整响应。

---

#### 5.1.2 同步对话补全

```
POST /api/v1/models/chat/sync
```

请求体同上。

响应：
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "你好！有什么可以帮助你的？"
      }
    }
  ]
}
```

> 注意：此接口不使用 Result 包装，直接返回 OpenAI 兼容格式。

---

#### 5.1.3 文本嵌入

```
POST /api/v1/models/embeddings
```

请求体：
```json
{
  "input": "需要向量化的文本内容",
  "model": "text-embedding-3-small"
}
```

响应：
```json
{
  "embedding": [0.0023, -0.0134, 0.0456, ...]
}
```

> 注意：此接口不使用 Result 包装。

---

### 5.2 供应商管理 (Providers)

#### 5.2.1 列出供应商

```
GET /api/v1/models/providers
```

---

#### 5.2.2 获取供应商详情

```
GET /api/v1/models/providers/{id}
```

---

#### 5.2.3 创建供应商

```
POST /api/v1/models/providers
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 否 | 租户 ID（默认 `system`） |

请求体：
```json
{
  "name": "OpenAI",
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-xxx",
  "config": "{\"orgId\": \"org-xxx\"}"
}
```

---

#### 5.2.4 更新供应商

```
PUT /api/v1/models/providers/{id}
```

---

#### 5.2.5 删除供应商

```
DELETE /api/v1/models/providers/{id}
```

---

#### 5.2.6 列出供应商下的模型

```
GET /api/v1/models/providers/{id}/models
```

---

#### 5.2.7 创建模型定义

```
POST /api/v1/models/providers/{id}/models
```

请求体：
```json
{
  "name": "gpt-4o",
  "modelType": "chat",
  "contextWindow": 128000,
  "config": "{}"
}
```

---

### 5.3 模型池 (Pools)

#### 5.3.1 创建模型池

```
POST /api/v1/models/pools
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 否 | 租户 ID |

请求体：
```json
{
  "name": "default-pool",
  "strategy": "round_robin",
  "description": "默认模型池",
  "fallbackPoolId": null
}
```

`strategy` 可选值：`round_robin`, `weighted`, `latency`, `cost`

---

#### 5.3.2 列出模型池

```
GET /api/v1/models/pools
```

---

#### 5.3.3 获取模型池详情

```
GET /api/v1/models/pools/{id}
```

---

#### 5.3.4 更新模型池

```
PUT /api/v1/models/pools/{id}
```

---

#### 5.3.5 删除模型池

```
DELETE /api/v1/models/pools/{id}
```

---

#### 5.3.6 添加池目标

```
POST /api/v1/models/pools/{poolId}/targets
```

请求体：
```json
{
  "modelDefinitionId": "md_001",
  "weight": 70,
  "priority": 1
}
```

---

#### 5.3.7 列出池目标

```
GET /api/v1/models/pools/{poolId}/targets
```

---

#### 5.3.8 移除池目标

```
DELETE /api/v1/models/pools/{poolId}/targets/{targetId}
```

---

### 5.4 路由规则 (Routing Rules)

#### 5.4.1 创建路由规则

```
POST /api/v1/models/pools/rules
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 否 | 租户 ID |

请求体：
```json
{
  "name": "high-priority-rule",
  "conditions": "{\"tenantPlan\": \"enterprise\"}",
  "targetPoolId": "pool_premium",
  "fallbackPoolId": "pool_default",
  "ruleOrder": 1
}
```

---

#### 5.4.2 列出路由规则

```
GET /api/v1/models/pools/rules
```

---

#### 5.4.3 更新路由规则

```
PUT /api/v1/models/pools/rules/{id}
```

---

#### 5.4.4 删除路由规则

```
DELETE /api/v1/models/pools/rules/{id}
```

---

## 6. abc-mcp-gateway — MCP 工具网关

> 后端端口 9103 | 网关路由：`/api/v1/mcp/**`

### 6.1 工具 (Tools)

#### 6.1.1 列出可用工具

```
GET /api/v1/mcp/tools?tenantId=tnt_xyz456
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `tenantId` | 否 | 租户 ID（默认 `system`） |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "name": "web-search",
      "description": "搜索互联网内容",
      "parameters": { "query": { "type": "string", "required": true } }
    }
  ]
}
```

---

#### 6.1.2 执行工具

```
POST /api/v1/mcp/tools/{toolName}/execute
```

请求体：
```json
{
  "query": "ABC Platform latest news"
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "result": "搜索结果内容..."
  }
}
```

---

### 6.2 MCP 服务器管理 (Servers)

#### 6.2.1 列出 MCP 服务器

```
GET /api/v1/mcp/servers
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 否 | 租户 ID |

---

#### 6.2.2 获取 MCP 服务器详情

```
GET /api/v1/mcp/servers/{id}
```

---

#### 6.2.3 创建 MCP 服务器

```
POST /api/v1/mcp/servers
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 否 | 租户 ID |

请求体：
```json
{
  "name": "custom-tools",
  "description": "自定义工具服务器",
  "endpoint": "http://tools-server:8080",
  "authType": "bearer",
  "authConfig": "{\"token\": \"xxx\"}"
}
```

---

#### 6.2.4 更新 MCP 服务器

```
PUT /api/v1/mcp/servers/{id}
```

---

#### 6.2.5 删除 MCP 服务器

```
DELETE /api/v1/mcp/servers/{id}
```

---

#### 6.2.6 同步工具列表

```
POST /api/v1/mcp/servers/{id}/sync
```

说明：从 MCP 服务器端点同步工具定义。

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "tool_001",
      "serverId": "srv_001",
      "name": "web-search",
      "description": "搜索互联网内容"
    }
  ]
}
```

---

## 7. abc-channel-hub — 渠道集成

> 后端端口 8081 | 网关路由：`/api/v1/channels/**`

### 7.1 Slack 事件接收

```
POST /api/v1/channels/slack/events
```

请求体：Slack Events API 标准格式。

说明：
- 自动处理 Slack URL 验证（`url_verification` 事件）
- 接收消息事件后路由到对应的智能体处理

---

### 7.2 飞书事件接收

```
POST /api/v1/channels/feishu/events
```

请求体：飞书事件订阅标准格式。

说明：
- 自动处理飞书 URL 验证（`challenge` 事件）
- 接收消息事件后路由到对应的智能体处理

---

### 7.3 通用 Webhook

```
POST /api/v1/channels/webhook
```

请求体：
```json
{
  "agentId": "agent_001",
  "message": "来自外部系统的消息",
  "metadata": {}
}
```

---

## 8. abc-governance — 治理中心

> 后端端口 9004 | 网关路由：`/api/v1/registry/**`

### 8.1 标签 (Tags)

#### 8.1.1 创建标签

```
POST /api/v1/registry/tags
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 否 | 租户 ID |

请求体：
```json
{
  "key": "department",
  "value": "engineering"
}
```

---

#### 8.1.2 列出标签

```
GET /api/v1/registry/tags
```

| Header / 参数 | 必填 | 说明 |
|--------------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |
| `key` | 否 | 按键名过滤 |

---

#### 8.1.3 删除标签

```
DELETE /api/v1/registry/tags/{id}
```

---

#### 8.1.4 关联标签到资源

```
POST /api/v1/registry/tags/{tagId}/attach
```

请求体：
```json
{
  "resourceType": "agent",
  "resourceId": "agent_001"
}
```

---

#### 8.1.5 取消标签关联

```
DELETE /api/v1/registry/tags/{tagId}/detach?resourceType=agent&resourceId=agent_001
```

---

#### 8.1.6 获取资源的标签

```
GET /api/v1/registry/resources/{resourceType}/{resourceId}/tags
```

---

#### 8.1.7 获取标签关联的资源

```
GET /api/v1/registry/tags/{tagId}/resources
```

---

### 8.2 资源组 (Groups)

#### 8.2.1 创建资源组

```
POST /api/v1/registry/groups
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 否 | 租户 ID |

请求体：
```json
{
  "name": "核心服务",
  "description": "核心智能体和工作流",
  "parentId": null
}
```

---

#### 8.2.2 列出资源组

```
GET /api/v1/registry/groups
```

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tenant-Id` | 是 | 租户 ID |

---

#### 8.2.3 列出子资源组

```
GET /api/v1/registry/groups/{id}/children
```

---

#### 8.2.4 更新资源组

```
PUT /api/v1/registry/groups/{id}
```

---

#### 8.2.5 删除资源组

```
DELETE /api/v1/registry/groups/{id}
```

---

### 8.3 能力注册 (Capabilities)

#### 8.3.1 注册能力

```
POST /api/v1/registry/capabilities
```

请求体：
```json
{
  "tenantId": "tnt_xyz456",
  "name": "text-summarization",
  "type": "agent",
  "resourceId": "agent_001",
  "description": "文本摘要能力",
  "inputSchema": "{}",
  "outputSchema": "{}"
}
```

---

#### 8.3.2 列出能力

```
GET /api/v1/registry/capabilities?tenantId=tnt_xyz456&status=active
```

---

#### 8.3.3 发现能力

```
GET /api/v1/registry/capabilities/discover?tenantId=tnt_xyz456&type=agent
```

说明：服务发现接口，根据类型过滤可用能力。

---

#### 8.3.4 获取能力详情

```
GET /api/v1/registry/capabilities/{id}
```

---

#### 8.3.5 更新能力

```
PUT /api/v1/registry/capabilities/{id}
```

---

#### 8.3.6 删除能力

```
DELETE /api/v1/registry/capabilities/{id}
```

---

## 9. abc-license — 许可证服务

> 后端端口 9104 | 网关路由：`/api/v1/license/**`

### 9.1 生成许可证

```
POST /api/v1/license/generate
```

请求体：
```json
{
  "customerName": "Acme Corp",
  "expiryAt": "2027-03-04T00:00:00Z",
  "modules": ["agent", "workflow", "knowledge"],
  "quotas": { "maxAgents": 100, "maxUsers": 50 }
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "licenseKey": "eyJhbGciOiJI...",
    "expiryAt": "2027-03-04T00:00:00Z"
  }
}
```

说明：仅平台管理员可用，需服务端配置 `license.secretKey`。

---

### 9.2 激活许可证

```
POST /api/v1/license/activate
```

请求体：
```json
{
  "tenantId": "tnt_xyz456",
  "licenseKey": "eyJhbGciOiJI..."
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "ok": true,
    "expiryAt": "2027-03-04T00:00:00Z",
    "modules": ["agent", "workflow", "knowledge"]
  }
}
```

---

### 9.3 查询许可证状态

```
GET /api/v1/license/status?tenantId=tnt_xyz456
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "active": true,
    "expiryAt": "2027-03-04T00:00:00Z",
    "modules": ["agent", "workflow", "knowledge"],
    "quotas": { "maxAgents": 100, "maxUsers": 50 },
    "readOnly": false
  }
}
```

---

### 9.4 许可证写入权限检查

```
GET /api/v1/license/check?tenantId=tnt_xyz456
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "writeAllowed": true
  }
}
```

说明：供网关过滤器调用，检查租户是否仍可执行写操作（许可证未过期）。

---

## 10. Gateway 审计日志

> 网关本地处理 | 路由：`/api/v1/audit/**`

### 10.1 搜索审计日志

```
GET /api/v1/audit/search
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `tenantId` | 否 | 按租户过滤 |
| `method` | 否 | 按 HTTP 方法过滤 |
| `path` | 否 | 按路径过滤 |
| `limit` | 否 | 返回数量，默认 50，最大 5000 |

响应：
```json
{
  "total": 10000,
  "returned": 50,
  "records": [
    {
      "timestamp": "2026-03-04T10:00:00Z",
      "tenantId": "tnt_xyz456",
      "userId": "usr_001",
      "method": "POST",
      "path": "/api/v1/tasks",
      "clientIp": "192.168.1.100",
      "statusCode": 200,
      "authType": "bearer"
    }
  ]
}
```

> 注意：此接口不使用 Result 包装。

---

### 10.2 导出审计日志 (CSV)

```
GET /api/v1/audit/export?format=csv&limit=1000
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `format` | 否 | 仅支持 `csv`（默认） |
| `limit` | 否 | 导出数量，默认 1000，最大 5000 |

响应：`text/csv` 格式文件下载。

CSV 列：`timestamp, tenantId, userId, method, path, clientIp, statusCode, authType`

---

## 附录

### 网关路由总览

| 路径前缀 | 目标服务 | 端口 |
|----------|---------|------|
| `/api/v1/auth/**`, `/api/v1/policy/**`, `/api/v1/tenants/**`, `/api/v1/users/**` | abc-auth | 9101 |
| `/api/v1/tasks/**`, `/api/v1/chat/**`, `/api/v1/agents/**`, `/api/v1/prompts/**`, `/api/v1/workflows/**`, `/api/v1/trigger/**`, `/api/v1/eval/**`, `/api/v1/conversations/**`, `/api/v1/approval/**`, `/api/v1/metrics/**`, `/api/v1/skills/**`, `/api/v1/marketplace/**`, `/api/v1/trace/**` | abc-engine | 9001 |
| `/api/v1/memory/**`, `/api/v1/kb/**` | abc-atlas | 9201 |
| `/api/v1/models/**` | abc-llm-gateway | 9102 |
| `/api/v1/mcp/**` | abc-mcp-gateway | 9103 |
| `/api/v1/channels/**` | abc-channel-hub | 8081 |
| `/api/v1/registry/**` | abc-governance | 9004 |
| `/api/v1/license/**` | abc-license | 9104 |
| `/api/v1/audit/**` | Gateway 本地 | 8080 |

### SSE 事件类型一览

| 事件类型 | 说明 |
|---------|------|
| `INIT` | 初始化事件，包含 taskId 和 sessionId |
| `THINKING` | 智能体正在思考 |
| `TOOL_CALL` | 智能体发起工具调用 |
| `TOOL_RESULT` | 工具调用返回结果 |
| `TEXT_CHUNK` | 流式文本片段 |
| `COMPLETED` | 任务完成 |
| `FAILED` | 任务失败 |
| `APPROVAL_REQUIRED` | 需要人工审批 |
