# MCP Server 认证管理系统实现计划

## 架构概述

系统采用分表设计，将参数定义和参数值分离：

1. **认证参数定义层**：`t_mcp_auth_param_config` 表存储不同认证类型的参数定义模板（位置、类型、验证规则等）
2. **服务器认证配置层**：`t_mcp_server_auth_config` 表存储每个 MCP Server 的实际认证配置值
3. **用户连接认证配置层**：`t_mcp_connection_auth_config` 表存储每个用户连接的用户参数配置值
4. **移除 JSON 字段**：`t_mcp_server` 表的 `auth_config` 字段将被移除，`t_mcp_tenant_server_connection` 表的 `credentials` 字段将被移除，完全使用分表存储

## 数据库设计

### 1. 认证参数定义表 (`t_mcp_auth_param_config`)

存储不同认证类型的参数定义模板：

```sql
CREATE TABLE mcp.t_mcp_auth_param_config (
    id VARCHAR(100) PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL,
    server_id VARCHAR(100) NOT NULL,   -- 关联 t_mcp_server.id（必须关联，不设全局模板）
    param_key VARCHAR(100) NOT NULL,   -- 参数键名，如 "api_key", "client_id"
    param_name VARCHAR(200),           -- 参数显示名称
    param_type VARCHAR(32) NOT NULL,   -- STRING, NUMBER, BOOLEAN, SECRET
    location VARCHAR(32) NOT NULL,     -- HEADER, QUERY, BODY, COOKIE
    location_name VARCHAR(200),       -- 在对应位置中的名称，如 Header 中的 "X-API-Key"
    level_scope VARCHAR(32) NOT NULL,  -- SYSTEM=系统/管理员参数, USER=用户参数
    is_required BOOLEAN NOT NULL,      -- 是否必填
    default_value TEXT,                -- 默认值
    validation_rule TEXT,              -- JSON格式的验证规则：{"pattern": "...", "minLength": 10, "maxLength": 100}
    description TEXT,                  -- 参数描述
    example_value TEXT,                -- 示例值
    sort_order INTEGER,                -- 排序
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (server_id) REFERENCES mcp.t_mcp_server(id) ON DELETE CASCADE,
    UNIQUE(server_id, param_key)
);
```

### 2. 服务器认证配置值表 (`t_mcp_server_auth_config`)

存储每个 MCP Server 的**管理员参数**配置值（服务器级别，所有用户共享）：

```sql
CREATE TABLE mcp.t_mcp_server_auth_config (
    id VARCHAR(100) PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL,
    server_id VARCHAR(100) NOT NULL,  -- 关联 t_mcp_server.id
    param_key VARCHAR(100) NOT NULL,   -- 参数键名，对应 t_mcp_auth_param_config.param_key（必须是 level_scope='SYSTEM' 的参数）
    param_value TEXT,                  -- 参数值（敏感信息需要加密存储）
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (server_id) REFERENCES mcp.t_mcp_server(id) ON DELETE CASCADE,
    UNIQUE(server_id, param_key)
);
```

### 3. 用户连接认证配置值表 (`t_mcp_connection_auth_config`)

存储每个用户连接的**用户参数**配置值（用户级别，每个用户独立）：

```sql
CREATE TABLE mcp.t_mcp_connection_auth_config (
    id VARCHAR(100) PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL,
    connection_id VARCHAR(100) NOT NULL,  -- 关联 t_mcp_tenant_server_connection.id
    param_key VARCHAR(100) NOT NULL,      -- 参数键名，对应 t_mcp_auth_param_config.param_key（必须是 level_scope='USER' 的参数）
    param_value TEXT,                     -- 参数值（敏感信息需要加密存储）
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (connection_id) REFERENCES mcp.t_mcp_tenant_server_connection(id) ON DELETE CASCADE,
    UNIQUE(connection_id, param_key)
);
```

### 4. 修改现有表结构

**`t_mcp_server` 表**：

- **移除** `auth_config` 字段（JSONB 类型）
- 认证配置通过关联 `t_mcp_server_auth_config` 表获取

**`t_mcp_tenant_server_connection` 表**：

- **移除** `credentials` 字段（JSONB 类型）- 用户参数改为存储在 `t_mcp_connection_auth_config` 表中
- **移除** `virtual_server_id` 字段
- **保留** `oauth_state` 字段，用于 OAuth2 授权流程的临时 state 存储

## 实现任务清单

### 阶段1：实体类和数据库迁移

- [ ] **create-auth-param-entity**: 创建 `McpAuthParamConfigEntity` 实体类
- [ ] **create-server-auth-entity**: 创建 `McpServerAuthConfigEntity` 实体类
- [ ] **create-connection-auth-entity**: 创建 `McpConnectionAuthConfigEntity` 实体类
- [ ] **create-repositories**: 创建对应的 Repository 接口
- [ ] **create-auth-param-db**: 创建数据库迁移脚本，包括：
  - 创建 `t_mcp_auth_param_config` 表
  - 创建 `t_mcp_server_auth_config` 表
  - 创建 `t_mcp_connection_auth_config` 表
  - 移除 `t_mcp_server.auth_config` 字段
  - 移除 `t_mcp_tenant_server_connection.credentials` 字段
  - 移除 `t_mcp_tenant_server_connection.virtual_server_id` 字段

### 阶段2：DTO 类

- [ ] **create-auth-dtos**: 创建认证相关的 DTO：
  - `AuthParamConfigRequest.java` - 参数配置请求
  - `AuthParamConfigResponse.java` - 参数配置响应
  - `McpServerAuthConfigRequest.java` - 服务器管理员认证配置请求
  - `McpServerAuthConfigResponse.java` - 服务器管理员认证配置响应
  - `UserConnectionRequest.java` - 用户创建连接请求
  - `UserConnectionResponse.java` - 用户连接响应
  - `AuthConfigTemplateResponse.java` - 认证类型模板响应

### 阶段3：服务层

- [ ] **create-auth-param-service**: 创建 `McpAuthParamConfigService`，实现：
  - `getParamConfigsByServerId(String serverId)` - 获取所有参数定义
  - `getSystemParamConfigsByServerId(String serverId)` - 获取系统参数定义
  - `getUserParamConfigsByServerId(String serverId)` - 获取用户参数定义
  - `getParamConfigByServerIdAndKey(String serverId, String paramKey)` - 获取特定参数定义
  - `saveServerParamConfig(String serverId, List<AuthParamConfigRequest> configs)` - 保存参数定义
  - `validateAuthConfig(String serverId, Map<String, String> configValues, String levelScope)` - 验证配置值

- [ ] **create-server-auth-service**: 创建 `McpServerAuthConfigService`，实现：
  - `saveSystemAuthConfig(String serverId, Map<String, String> configValues)` - 保存系统认证配置
  - `getSystemAuthConfigByServerId(String serverId)` - 获取系统认证配置
  - `deleteSystemAuthConfigByServerId(String serverId)` - 删除系统认证配置
  - `getSystemAuthConfigAsMap(String serverId)` - 获取系统认证配置 Map

- [ ] **create-connection-auth-service**: 创建 `McpConnectionAuthConfigService`，实现：
  - `saveUserAuthConfig(String connectionId, Map<String, String> configValues)` - 保存用户认证配置
  - `getUserAuthConfigByConnectionId(String connectionId)` - 获取用户认证配置
  - `deleteUserAuthConfigByConnectionId(String connectionId)` - 删除用户认证配置
  - `getUserAuthConfigAsMap(String connectionId)` - 获取用户认证配置 Map

### 阶段4：增强现有服务

- [ ] **enhance-server-service**: 增强 `McpServerService`：
  - 移除 `authConfig` JSON 字段的处理
  - 改为使用 `McpServerAuthConfigService` 管理系统认证配置
  - 在查询服务器时，通过关联查询获取管理员认证配置

- [ ] **enhance-connection-service**: 增强 `McpTenantServerConnectionService`：
  - 移除 `credentials` 字段处理
  - 支持用户参数的保存、验证
  - 实现配置合并逻辑（管理员配置 + 用户凭证）
  - 实现 `mergeAuthConfig(String serverId, String connectionId)` 方法

- [ ] **remove-credentials-field**: 修改 `McpTenantServerConnectionEntity`：
  - 移除 `credentials` 字段
  - 移除 `virtualServerId` 字段
  - 更新相关索引定义

### 阶段5：OAuth2 服务

- [ ] **create-oauth2-service**: 创建 `OAuth2Service`，实现：
  - `initiateOAuth2Flow(String serverId, String tenantId, String userId, String redirectUri)` - 初始化 OAuth2 授权流程
  - `handleOAuth2Callback(String state, String code)` - 处理 OAuth2 回调
  - `refreshOAuth2Token(String connectionId)` - 刷新 OAuth2 token
  - `getOAuth2AuthorizationUrl(String serverId, String state)` - 获取授权 URL
  - `validateOAuth2Config(String serverId)` - 验证 OAuth2 配置

### 阶段6：控制器

- [ ] **create-auth-param-controller**: 创建 `McpAuthParamConfigController`：
  - `GET /mcp/admin/servers/{serverId}/auth-params` - 获取参数定义
  - `PUT /mcp/admin/servers/{serverId}/auth-params` - 保存/更新参数定义
  - `GET /mcp/admin/auth-params/templates/{authType}` - 获取认证类型模板

- [ ] **enhance-server-controller**: 增强 `McpServerController`：
  - 移除 `authConfig` 字段处理
  - `GET /mcp/admin/servers/{serverId}/auth-config` - 获取服务器认证配置
  - `PUT /mcp/admin/servers/{serverId}/auth-config` - 更新服务器认证配置
  - `DELETE /mcp/admin/servers/{serverId}/auth-config` - 删除服务器认证配置

- [ ] **create-connection-controller**: 创建 `McpConnectionController`：
  - `POST /mcp/user/connections` - 用户创建连接
  - `PUT /mcp/user/connections/{connectionId}` - 用户更新连接凭证
  - `GET /mcp/user/connections` - 获取用户的连接列表
  - `GET /mcp/user/connections/{connectionId}` - 获取连接详情
  - `DELETE /mcp/user/connections/{connectionId}` - 删除连接

- [ ] **create-oauth2-controller**: 创建 `OAuth2Controller`：
  - `GET /mcp/user/oauth2/authorize/{serverId}` - 启动 OAuth2 授权流程
  - `GET /mcp/user/oauth2/callback` - OAuth2 回调处理
  - `POST /mcp/user/oauth2/refresh/{connectionId}` - 刷新 OAuth2 token
  - `GET /mcp/user/oauth2/status/{connectionId}` - 查询 OAuth2 授权状态

- [ ] **enhance-user-controller**: 增强 `McpServerUserController`：
  - 添加获取认证模板的接口

### 阶段7：DTO 更新

- [ ] **update-server-dtos**: 更新服务器相关 DTO：
  - 修改 `McpServerCreateRequest`，移除 `authConfig` 字段
  - 修改 `McpServerUpdateRequest`，移除 `authConfig` 字段
  - 修改 `McpServerResponse`，移除 `authConfig` 字段

## 关键实现细节

### 实体类继承

所有实体类继承 `SuperEntity`，包含：

- `id` (String, UUID)
- `tenantId` (String)
- `createdAt` (Instant)
- `updatedAt` (Instant)

### 参数类型枚举

需要创建以下枚举：

- `ParamType`: STRING, NUMBER, BOOLEAN, SECRET
- `ParamLocation`: HEADER, QUERY, BODY, COOKIE
- `LevelScope`: SYSTEM, USER

### OAuth2 授权流程

1. **授权开始**：

   - 创建连接记录（status=PENDING）
   - 将 state 保存到 `oauth_state` 字段
   - 重定向到授权服务器

2. **授权回调**：

   - 根据 state 查询连接记录
   - 验证 state 是否有效且未过期（5-10分钟）
   - 使用 code 换取 token
   - 更新连接记录（status=ACTIVE），清除 `oauth_state`
   - 保存 token 到 `t_mcp_connection_auth_config` 表

### 阶段8：认证模板自动应用

支持创建 MCP Server 时选择认证模板，前端展示模板参数供用户编辑后随创建请求一并提交。模板仅用于前端展示和预填充，不传模版 ID，按标准自定义参数方式提交。

**交互流程**：

1. 前端调用 `GET /mcp/admin/auth-params/templates/{authType}` 获取模板参数列表
2. 用户在 UI 上查看模板参数，可增加/删除/修改任意参数
3. 用户提交创建请求时，将最终参数列表放入 `authParamConfigs` 字段提交
4. 后端一次性写入 `t_mcp_auth_param_config` 表

**实现任务**：

- [x] **add-authParamConfigs-to-create-request**: `McpServerCreateRequest` 增加 `authParamConfigs` 字段（`List<AuthParamConfigRequest>`）
- [x] **add-applyAuthTemplate-method**: `McpAuthParamConfigService` 增加 `applyAuthTemplate(serverId, authType, tenantId)` 接口和实现
- [x] **integrate-createServer**: `McpServerServiceImpl.createServer` 集成逻辑：
  - 若 `authParamConfigs` 不为空 → 调用 `saveServerParamConfigs` 存储用户编辑后的参数
  - 若 `authParamConfigs` 为空且 `authType != NONE` → 调用 `applyAuthTemplate` 自动应用默认模板
- [x] **add-authParamConfigs-to-response**: `McpServerResponse` 增加 `authParamConfigs` 字段（`List<AuthParamConfigResponse>`），`toResponse()` 方法中查询并填充

### 阶段9：认证模板数据库化与管理 API

将认证类型标准模板从硬编码迁移到数据库存储，提供管理端 API 进行模板 CRUD 和手动初始化。

**详细 plan 见**：[auth_template_db_seeding.plan.md](auth_template_db_seeding.plan.md)

**实现任务**：

- [x] **create-template-entity-repo**: 新建 `McpAuthTypeTemplateEntity` 实体和 `McpAuthTypeTemplateRepository`
- [x] **add-bearer-token-enum**: `McpServerAuthType` 枚举增加 `BEARER_TOKEN`
- [x] **refactor-service-db-template**: 改造 `McpAuthParamConfigService`：`getAuthTypeTemplate` 从 DB 读取 + fallback；新增 `getAllTemplates` / `saveTemplate` / `deleteTemplate` / `initDefaultTemplates`
- [x] **enhance-controller-template-crud**: `McpAuthParamConfigController` 新增模板 CRUD API（列表/新增/更新/删除/手动初始化）
- [x] **remove-data-initializer**: 移除 `AuthTemplateDataInitializer`（启动自动初始化），改为 `POST /mcp/admin/auth-params/templates/init` 手动触发

**模板管理 API 清单**：

| 方法 | 路径 | 说明 |

|------|------|------|

| `GET` | `/mcp/admin/auth-params/templates` | 获取所有模板列表 |

| `GET` | `/mcp/admin/auth-params/templates/{authType}` | 获取指定类型的模板 |

| `POST` | `/mcp/admin/auth-params/templates` | 新增自定义模板 |

| `PUT` | `/mcp/admin/auth-params/templates/{authType}` | 更新模板 |

| `DELETE` | `/mcp/admin/auth-params/templates/{authType}` | 删除模板（内置不可删） |

| `POST` | `/mcp/admin/auth-params/templates/init` | 一键初始化 5 种内置标准模板 |

**数据库新增表**：`t_mcp_auth_type_template`（详见 auth_template_db_seeding.plan.md）

---

## 阶段10：MCP Server 代理与工具同步

**详细设计文档**：见 [`mcp_proxy_implementation.plan.md`](mcp_proxy_implementation.plan.md)

### 新增文件

| 文件 | 说明 |

|------|------|

| `McpProxyConfig.java` | 代理专用 RestClient 配置（连接超时 5s，读取超时 30s） |

| `McpToolSyncService.java` | 工具同步服务（冷却时间 + serverId 级锁 + MD5 哈希去重） |

| `McpProxyHandler.java` | 代理核心处理器（HTTP/SSE 代理 + 认证注入 + 工具同步触发） |

| `McpProxyController.java` | 代理路由控制器 |

| `ProxyServerInfoResponse.java` | 用户已连接服务器列表 DTO |

### 代理 API

| 方法 | 路径 | 说明 |

|------|------|------|

| `ANY` | `/mcp/proxy/{serverId}/**` | 代理所有 HTTP 方法到指定 MCP Server |

| `ANY` | `/mcp/proxy/sse/{serverId}/**` | SSE 流式代理 |

| `GET` | `/mcp/proxy/servers` | 获取当前用户已连接的所有可代理 MCP Server 列表 |

| `GET` | `/mcp/proxy/health` | 代理服务健康检查 |

| `POST` | `/mcp/proxy/{serverId}/sync-tools` | 手动触发工具同步 |

### 代码质量优化

- [x] 修复 `McpServerServiceImpl.toResponse()` N+1 查询（改用 `findByServerId` + `findAllById`）
- [x] 移除多个 Service 中冗余的 `createdAt`/`updatedAt` 手动设置（依赖 `SuperEntity` 自动管理）
- [x] 修复 `McpSyncService.syncTools()` 不做去重问题（委托 `McpToolSyncService.syncToolsToDatabase()`）
- [x] 修复 `McpAuthParamConfigServiceImpl.initDefaultTemplates()` 中 `indexOf` 低效问题
- [x] 修复 `McpConnectionAuthConfigServiceImpl.saveUserAuthConfig()` 逐条保存问题（改用 `saveAll`）

---

## 注意事项

1. 所有敏感信息（如密码、token）需要加密存储
2. 参数验证需要支持 JSON 格式的验证规则
3. OAuth2 state 验证需要考虑过期时间（通常5-10分钟）
4. 删除服务器时，需要级联删除相关的认证配置
5. 删除连接时，需要级联删除相关的用户认证配置