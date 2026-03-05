# ABC Auth API

## POST 注册租户与管理员

POST /auth/register

> Body 请求参数

```json
{
  "tenantName": "Acme Corp",
  "username": "admin",
  "password": "securePass123",
  "email": "admin@acme.com"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 是 |none|
| tenantName|body|string| 是 |租户名称|
| username|body|string| 是 |管理员用户名|
| password|body|string| 是 |管理员密码|
| email|body|string| 是 |管理员邮箱|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "userId": "user_abc123",
    "tenantId": "tenant_abc123",
    "username": "admin",
    "role": "admin"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|注册成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[LoginResponse](#schemaloginresponse)|true|none||登录响应|
| token|string|true|none||JWT 访问令牌|
| userId|string|true|none||用户ID|
| tenantId|string|true|none||租户ID|
| username|string|true|none||用户名|
| role|string|true|none||用户角色|

## POST 用户登录

POST /auth/login

> Body 请求参数

```json
{
  "username": "admin",
  "password": "password123",
  "tenantId": "tenant_abc123"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 是 |none|
| username|body|string| 是 |用户名|
| password|body|string| 是 |密码|
| tenantId|body|string| 否 |租户ID，平台管理员可不传|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "userId": "user_abc123",
    "tenantId": "tenant_abc123",
    "username": "admin",
    "role": "admin"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|登录成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[LoginResponse](#schemaloginresponse)|true|none||登录响应|
| token|string|true|none||JWT 访问令牌|
| userId|string|true|none||用户ID|
| tenantId|string|true|none||租户ID|
| username|string|true|none||用户名|
| role|string|true|none||用户角色|

## POST 校验 JWT Token

POST /auth/validate

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 是 |Bearer JWT 令牌|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "userId": "user_abc123",
    "tenantId": "tenant_abc123",
    "username": "admin",
    "role": "admin"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|令牌有效|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[TokenPayload](#schematokenpayload)|true|none||令牌载荷|
| userId|string|true|none||用户ID|
| tenantId|string|true|none||租户ID|
| username|string|true|none||用户名|
| role|string|true|none||用户角色|

## POST 校验 API Key

POST /auth/api-key/verify

> Body 请求参数

```json
{
  "apiKey": "abc_1234abcd5678efgh"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 是 |none|
| apiKey|body|string| 是 |完整的 API Key|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "tenantId": "tenant_abc123",
    "userId": "user_abc123",
    "scopes": ["chat", "agent:read"]
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|校验成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[ApiKeyVerifyResponse](#schemaapikeyverifyresponse)|true|none||校验结果|
| tenantId|string|true|none||所属租户ID|
| userId|string|true|none||关联用户ID|
| scopes|[string]|true|none||授权范围列表|

## POST 创建 API Key

POST /auth/api-keys

> Body 请求参数

```json
{
  "tenantId": "tenant_abc123",
  "name": "Production Key",
  "createdBy": "user_abc123",
  "expiresAt": "2027-01-01T00:00:00Z",
  "scopes": "chat,agent:read"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 是 |none|
| tenantId|body|string| 是 |租户ID|
| name|body|string| 是 |Key 名称|
| createdBy|body|string| 是 |创建者用户ID|
| expiresAt|body|string(date-time)| 否 |过期时间，null 表示永不过期|
| scopes|body|string| 否 |权限范围，逗号分隔|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "ak_abc123",
    "name": "Production Key",
    "keyPrefix": "abc_1234",
    "rawKey": "abc_1234abcd5678efgh",
    "tenantId": "tenant_abc123",
    "status": "active",
    "expiresAt": "2027-01-01T00:00:00Z",
    "createdAt": "2026-03-05T10:30:00Z"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|创建成功，rawKey 仅此次返回|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[CreateApiKeyResponse](#schemacreateapikeyresponse)|true|none||API Key 信息|
| id|string|true|none||API Key ID|
| name|string|true|none||Key 名称|
| keyPrefix|string|true|none||Key 前缀，用于识别|
| rawKey|string|true|none||完整 Key，仅此次返回，客户端需安全存储|
| tenantId|string|true|none||租户ID|
| status|string|true|none||Key 状态|
| expiresAt|string(date-time)|false|none||过期时间|
| createdAt|string(date-time)|true|none||创建时间|

## GET 列出 API Key

GET /auth/api-keys

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|tenantId|query|string| 是 |租户ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": [
    {
      "id": "ak_abc123",
      "name": "Production Key",
      "keyPrefix": "abc_1234",
      "status": "active",
      "expiresAt": "2027-01-01T00:00:00Z",
      "lastUsedAt": "2026-03-05T08:00:00Z",
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
| data|[[ApiKeyListItem](#schemaapikeylistitem)]|true|none||API Key 列表|
| id|string|true|none||API Key ID|
| name|string|true|none||Key 名称|
| keyPrefix|string|true|none||Key 前缀|
| status|string|true|none||Key 状态|
| expiresAt|string(date-time)|false|none||过期时间|
| lastUsedAt|string(date-time)|false|none||最后使用时间|
| createdAt|string(date-time)|true|none||创建时间|

## DELETE 撤销 API Key

DELETE /auth/api-keys/{id}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |API Key ID|
|tenantId|query|string| 是 |租户ID|

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

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|

## GET 列出启用的 OIDC 提供商

GET /auth/oauth2/providers

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|tenantId|query|string| 是 |租户ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": [
    {
      "id": "oidc_001",
      "tenantId": "tenant_abc123",
      "providerKey": "google",
      "displayName": "Google SSO",
      "clientId": "xxx.apps.googleusercontent.com",
      "issuerUrl": "https://accounts.google.com",
      "scopes": "openid profile email",
      "enabled": true,
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
| data|[[OidcProviderEntity](#schemaoidcproviderentity)]|true|none||OIDC 提供商列表（仅启用的）|
| id|string|true|none||提供商ID|
| tenantId|string|true|none||租户ID|
| providerKey|string|true|none||提供商标识，如 google, github, azure-ad|
| displayName|string|false|none||显示名称|
| clientId|string|true|none||OAuth2 Client ID|
| issuerUrl|string|false|none||OIDC Issuer URL|
| authorizationUrl|string|false|none||授权端点|
| tokenUrl|string|false|none||Token 端点|
| userinfoUrl|string|false|none||用户信息端点|
| jwksUrl|string|false|none||JWKS 端点|
| scopes|string|false|none||授权范围，空格分隔|
| enabled|boolean|true|none||是否启用|
| createdAt|string(date-time)|true|none||创建时间|
| updatedAt|string(date-time)|true|none||更新时间|

## GET 获取 OAuth2 授权 URL

GET /auth/oauth2/authorize

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|tenantId|query|string| 是 |租户ID|
|provider|query|string| 是 |提供商标识，如 google|
|redirectUri|query|string| 是 |回调重定向地址|
|state|query|string| 否 |CSRF 防护 state 参数|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "authorizeUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=xxx&redirect_uri=..."
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
| authorizeUrl|string|true|none||完整的 OAuth2 授权跳转 URL|

## POST OAuth2 回调

POST /auth/oauth2/callback

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|tenantId|query|string| 是 |租户ID|
|provider|query|string| 是 |提供商标识|
|code|query|string| 是 |OAuth2 授权码|
|redirectUri|query|string| 是 |与授权时一致的回调地址|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "userId": "user_abc123",
    "tenantId": "tenant_abc123",
    "username": "john.doe",
    "role": "member"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OAuth2 登录成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[LoginResponse](#schemaloginresponse)|true|none||登录响应|
| token|string|true|none||JWT 访问令牌|
| userId|string|true|none||用户ID|
| tenantId|string|true|none||租户ID|
| username|string|true|none||用户名|
| role|string|true|none||用户角色|

## POST 创建 OIDC 提供商

POST /auth/oauth2/providers

> Body 请求参数

```json
{
  "tenantId": "tenant_abc123",
  "providerKey": "google",
  "displayName": "Google SSO",
  "clientId": "xxx.apps.googleusercontent.com",
  "clientSecret": "GOCSPX-xxx",
  "issuerUrl": "https://accounts.google.com",
  "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth",
  "tokenUrl": "https://oauth2.googleapis.com/token",
  "userinfoUrl": "https://openidconnect.googleapis.com/v1/userinfo",
  "scopes": "openid profile email",
  "enabled": true
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[OidcProviderEntity](#schemaoidcproviderentity)| 是 |OIDC 提供商配置|
| tenantId|body|string| 是 |租户ID|
| providerKey|body|string| 是 |提供商标识|
| displayName|body|string| 否 |显示名称|
| clientId|body|string| 是 |OAuth2 Client ID|
| clientSecret|body|string| 是 |OAuth2 Client Secret|
| issuerUrl|body|string| 否 |OIDC Issuer URL|
| authorizationUrl|body|string| 否 |授权端点|
| tokenUrl|body|string| 否 |Token 端点|
| userinfoUrl|body|string| 否 |用户信息端点|
| jwksUrl|body|string| 否 |JWKS 端点|
| scopes|body|string| 否 |授权范围，空格分隔|
| enabled|body|boolean| 否 |是否启用|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "oidc_001",
    "tenantId": "tenant_abc123",
    "providerKey": "google",
    "displayName": "Google SSO",
    "clientId": "xxx.apps.googleusercontent.com",
    "enabled": true,
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
| data|[OidcProviderEntity](#schemaoidcproviderentity)|true|none||OIDC 提供商|

## PUT 更新 OIDC 提供商

PUT /auth/oauth2/providers/{id}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |提供商ID|
|body|body|[OidcProviderEntity](#schemaoidcproviderentity)| 是 |更新内容|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "oidc_001",
    "tenantId": "tenant_abc123",
    "providerKey": "google",
    "displayName": "Google SSO Updated",
    "enabled": true,
    "updatedAt": "2026-03-05T12:00:00Z"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|更新成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[OidcProviderEntity](#schemaoidcproviderentity)|true|none||更新后的 OIDC 提供商|

## DELETE 删除 OIDC 提供商

DELETE /auth/oauth2/providers/{id}

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

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|

## GET 列出所有 OIDC 提供商（含禁用）

GET /auth/oauth2/providers/all

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|tenantId|query|string| 是 |租户ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": [
    {
      "id": "oidc_001",
      "tenantId": "tenant_abc123",
      "providerKey": "google",
      "displayName": "Google SSO",
      "enabled": true
    },
    {
      "id": "oidc_002",
      "tenantId": "tenant_abc123",
      "providerKey": "github",
      "displayName": "GitHub",
      "enabled": false
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
| data|[[OidcProviderEntity](#schemaoidcproviderentity)]|true|none||全部 OIDC 提供商列表（含禁用）|

# 用户管理 (Users)

## GET 查询租户内用户列表

GET /users

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 是 |租户ID|
|status|query|string| 否 |用户状态过滤|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": [
    {
      "id": "user_abc123",
      "tenantId": "tenant_abc123",
      "username": "admin",
      "email": "admin@acme.com",
      "role": "admin",
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
| data|[[UserEntity](#schemauserentity)]|true|none||用户列表|
| id|string|true|none||用户ID|
| tenantId|string|true|none||租户ID|
| username|string|true|none||用户名|
| email|string|false|none||邮箱|
| role|string|true|none||角色|
| status|string|true|none||状态|
| createdAt|string(date-time)|true|none||创建时间|
| updatedAt|string(date-time)|true|none||更新时间|

## GET 按 ID 查询用户

GET /users/{id}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |用户ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "user_abc123",
    "tenantId": "tenant_abc123",
    "username": "admin",
    "email": "admin@acme.com",
    "role": "admin",
    "status": "active",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z"
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
| data|[UserEntity](#schemauserentity)|true|none||用户信息|

## GET 获取当前用户信息

GET /users/me

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-User-Id|header|string| 是 |当前用户ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "user_abc123",
    "tenantId": "tenant_abc123",
    "username": "admin",
    "email": "admin@acme.com",
    "role": "admin",
    "status": "active",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z"
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
| data|[UserEntity](#schemauserentity)|true|none||当前用户信息|

## POST 邀请用户

POST /users/invite

> Body 请求参数

```json
{
  "username": "john",
  "password": "pass123",
  "email": "john@acme.com",
  "role": "member"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|X-Tenant-Id|header|string| 是 |租户ID|
|body|body|object| 是 |none|
| username|body|string| 是 |用户名|
| password|body|string| 是 |密码|
| email|body|string| 否 |邮箱|
| role|body|string| 否 |角色，默认 member|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "user_def456",
    "tenantId": "tenant_abc123",
    "username": "john",
    "email": "john@acme.com",
    "role": "member",
    "status": "active",
    "createdAt": "2026-03-05T10:30:00Z",
    "updatedAt": "2026-03-05T10:30:00Z"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|邀请成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[UserEntity](#schemauserentity)|true|none||新建用户信息|

## PUT 更新用户

PUT /users/{id}

> Body 请求参数

```json
{
  "email": "newemail@acme.com",
  "role": "admin"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |用户ID|
|body|body|object| 否 |none|
| email|body|string| 否 |邮箱|
| role|body|string| 否 |角色|
| username|body|string| 否 |用户名|
| password|body|string| 否 |密码|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "user_abc123",
    "tenantId": "tenant_abc123",
    "username": "admin",
    "email": "newemail@acme.com",
    "role": "admin",
    "status": "active",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-03-05T12:00:00Z"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|更新成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[UserEntity](#schemauserentity)|true|none||更新后的用户信息|

## DELETE 禁用用户

DELETE /users/{id}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |用户ID|

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
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|禁用成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|

# 租户管理 (Tenants)

## GET 查询租户列表

GET /tenants

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|status|query|string| 否 |状态过滤|
|keyword|query|string| 否 |名称关键词搜索|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": [
    {
      "id": "tenant_abc123",
      "name": "Acme Corp",
      "status": "active",
      "plan": "pro",
      "config": "{\"maxAgents\": 50}",
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
| data|[[TenantEntity](#schematenantentity)]|true|none||租户列表|
| id|string|true|none||租户ID|
| name|string|true|none||租户名称|
| status|string|true|none||状态|
| plan|string|false|none||套餐|
| config|string(json)|false|none||配置信息（JSON）|
| createdAt|string(date-time)|true|none||创建时间|
| updatedAt|string(date-time)|true|none||更新时间|

#### 枚举值

|属性|值|
|---|---|
|status|active|
|status|frozen|

## GET 按 ID 查询租户

GET /tenants/{id}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |租户ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "tenant_abc123",
    "name": "Acme Corp",
    "status": "active",
    "plan": "pro",
    "config": "{\"maxAgents\": 50}",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z"
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
| data|[TenantEntity](#schematenantentity)|true|none||租户信息|

## POST 创建租户

POST /tenants

> Body 请求参数

```json
{
  "name": "New Corp",
  "plan": "basic"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[TenantEntity](#schematenantentity)| 是 |租户信息|
| name|body|string| 是 |租户名称|
| plan|body|string| 否 |套餐|
| config|body|string| 否 |配置（JSON）|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "tenant_new123",
    "name": "New Corp",
    "status": "active",
    "plan": "basic",
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
| data|[TenantEntity](#schematenantentity)|true|none||新建租户信息|

## PUT 更新租户

PUT /tenants/{id}

> Body 请求参数

```json
{
  "name": "Acme Corp Updated",
  "plan": "enterprise"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |租户ID|
|body|body|object| 否 |none|
| name|body|string| 否 |租户名称|
| plan|body|string| 否 |套餐|
| config|body|string| 否 |配置（JSON）|
| status|body|string| 否 |状态|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "tenant_abc123",
    "name": "Acme Corp Updated",
    "status": "active",
    "plan": "enterprise",
    "updatedAt": "2026-03-05T12:00:00Z"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|更新成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[TenantEntity](#schematenantentity)|true|none||更新后的租户信息|

## POST 冻结租户

POST /tenants/{id}/freeze

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |租户ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "tenant_abc123",
    "name": "Acme Corp",
    "status": "frozen",
    "updatedAt": "2026-03-05T12:00:00Z"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|冻结成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[TenantEntity](#schematenantentity)|true|none||冻结后的租户信息|

## POST 解冻租户

POST /tenants/{id}/unfreeze

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |租户ID|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "tenant_abc123",
    "name": "Acme Corp",
    "status": "active",
    "updatedAt": "2026-03-05T12:00:00Z"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|解冻成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[TenantEntity](#schematenantentity)|true|none||解冻后的租户信息|

# 权限策略 (Policy)

## POST 权限检查

POST /policy/check

> Body 请求参数

```json
{
  "tenantId": "tenant_abc123",
  "userId": "user_abc123",
  "role": "developer",
  "resource": "agent:my-agent",
  "action": "execute",
  "context": {
    "ip": "192.168.1.1"
  }
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[PolicyCheckRequest](#schemapolicycheckrequest)| 是 |none|
| tenantId|body|string| 是 |租户ID|
| userId|body|string| 是 |请求用户ID|
| role|body|string| 是 |用户角色|
| resource|body|string| 是 |目标资源标识|
| action|body|string| 是 |操作类型|
| context|body|object| 否 |附加上下文属性，用于 ABAC 评估|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "allowed": true,
    "reason": "Matched RBAC policy",
    "matchedPolicy": "policy_abc123"
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
| data|[PolicyCheckResult](#schemapolicycheckresult)|true|none||检查结果|
| allowed|boolean|true|none||是否允许访问|
| reason|string|true|none||决策原因|
| matchedPolicy|string|false|none||匹配的策略ID|

## GET 查询策略列表

GET /policy/policies

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|tenantId|query|string| 是 |租户ID|
|status|query|string| 否 |状态过滤|
|resourceType|query|string| 否 |资源类型过滤|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": [
    {
      "id": "policy_abc123",
      "tenantId": "tenant_abc123",
      "name": "Agent Execute Policy",
      "description": "Allow developers to execute agents",
      "policyType": "rbac",
      "rules": {
        "roles": ["developer", "admin"],
        "actions": ["execute"]
      },
      "resourceType": "agent",
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
| data|[[PolicyEntity](#schemapolicyentity)]|true|none||策略列表|
| id|string|true|none||策略ID|
| tenantId|string|true|none||租户ID|
| name|string|true|none||策略名称|
| description|string|false|none||策略描述|
| policyType|string|true|none||策略类型|
| rules|object|true|none||策略规则（JSON）|
| resourceType|string|false|none||资源类型|
| status|string|true|none||状态|
| createdAt|string(date-time)|true|none||创建时间|
| updatedAt|string(date-time)|true|none||更新时间|

#### 枚举值

|属性|值|
|---|---|
|policyType|rbac|
|policyType|abac|
|status|active|
|status|inactive|

## POST 创建策略

POST /policy/policies

> Body 请求参数

```json
{
  "tenantId": "tenant_abc123",
  "name": "Agent Execute Policy",
  "description": "Allow developers to execute agents",
  "policyType": "rbac",
  "rules": {
    "roles": ["developer", "admin"],
    "actions": ["execute"]
  },
  "resourceType": "agent"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 是 |none|
| tenantId|body|string| 是 |租户ID|
| name|body|string| 是 |策略名称|
| description|body|string| 否 |策略描述|
| policyType|body|string| 是 |策略类型（rbac / abac）|
| rules|body|object| 是 |策略规则|
| resourceType|body|string| 否 |资源类型|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "policy_new123",
    "tenantId": "tenant_abc123",
    "name": "Agent Execute Policy",
    "policyType": "rbac",
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
| data|[PolicyEntity](#schemapolicyentity)|true|none||新建策略|

## PUT 更新策略

PUT /policy/policies/{id}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |策略ID|
|body|body|object| 是 |更新内容|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "policy_abc123",
    "tenantId": "tenant_abc123",
    "name": "Updated Policy",
    "policyType": "rbac",
    "status": "active",
    "updatedAt": "2026-03-05T12:00:00Z"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|更新成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|
| data|[PolicyEntity](#schemapolicyentity)|true|none||更新后的策略|

## DELETE 删除策略

DELETE /policy/policies/{id}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |策略ID|

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

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
| code|integer|true|none||状态码|

## GET 查询角色权限列表

GET /policy/role-permissions

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|tenantId|query|string| 是 |租户ID|
|role|query|string| 否 |角色过滤|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": [
    {
      "id": "rp_001",
      "tenantId": "tenant_abc123",
      "role": "developer",
      "resource": "agent:*",
      "action": "execute",
      "effect": "allow",
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
| data|[[RolePermissionEntity](#schemarolepermissionentity)]|true|none||角色权限列表|
| id|string|true|none||权限ID|
| tenantId|string|true|none||租户ID|
| role|string|true|none||角色|
| resource|string|true|none||资源标识|
| action|string|true|none||操作类型|
| effect|string|true|none||效果（allow/deny）|
| createdAt|string(date-time)|true|none||创建时间|

#### 枚举值

|属性|值|
|---|---|
|effect|allow|
|effect|deny|

## POST 创建角色权限

POST /policy/role-permissions

> Body 请求参数

```json
{
  "tenantId": "tenant_abc123",
  "role": "developer",
  "resource": "agent:*",
  "action": "execute",
  "effect": "allow"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 是 |none|
| tenantId|body|string| 是 |租户ID|
| role|body|string| 是 |角色|
| resource|body|string| 是 |资源标识|
| action|body|string| 是 |操作类型|
| effect|body|string| 是 |效果（allow/deny）|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "data": {
    "id": "rp_new001",
    "tenantId": "tenant_abc123",
    "role": "developer",
    "resource": "agent:*",
    "action": "execute",
    "effect": "allow",
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
| data|[RolePermissionEntity](#schemarolepermissionentity)|true|none||新建角色权限|

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
