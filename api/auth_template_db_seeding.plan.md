# 认证类型标准模板数据库化

## 核心思路

当前模板（API_KEY / BASIC / OAUTH2 / NONE）硬编码在 `McpAuthParamConfigServiceImpl` 的 `buildXxxTemplate()` 方法中。改为：

1. 新建 **模板表** `t_mcp_auth_type_template` 存储标准模板
2. 提供 **管理端 API** 手动初始化标准模板和进行 CRUD 管理（不再自动启动初始化）
3. `getAuthTypeTemplate()` 优先从数据库读取，数据库无记录时 fallback 到代码内置默认值
4. 新增管理端 API 支持在线编辑模板
5. 模板参数在创建 MCP Server 时，前端展示供用户编辑，按自定义参数标准方式提交（不传模版 ID）

## 数据库设计

新增 `t_mcp_auth_type_template` 表：

```sql
CREATE TABLE mcp.t_mcp_auth_type_template (
    id VARCHAR(100) PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL DEFAULT 'system',
    auth_type VARCHAR(32) NOT NULL,      -- NONE, API_KEY, BASIC, OAUTH2, BEARER_TOKEN
    auth_type_name VARCHAR(200),
    description TEXT,
    param_templates TEXT NOT NULL,        -- JSON 数组，存储 List<AuthParamConfigRequest>
    is_builtin BOOLEAN DEFAULT true,     -- 是否内置模板（内置模板不可删除）
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(tenant_id, auth_type)
);
```

- `param_templates` 以 JSON 数组存储参数定义，结构与现有 `AuthParamConfigRequest` 一致
- `is_builtin = true` 表示系统内置模板，管理员可编辑但不可删除
- `tenant_id` 支持未来多租户自定义模板

## 标准模板内容（5 种内置模板）

| 认证类型 | 参数 | 默认值 | scope |

|---------|------|--------|-------|

| **NONE** | 无参数 | - | - |

| **API_KEY** | api_key | - | USER |

| **BASIC** | username, password | - | USER |

| **BEARER_TOKEN** | token | - | USER |

| **OAUTH2** | client_id, client_secret, authorization_url, token_url, scope, redirect_uri, grant_type, response_type | grant_type=authorization_code, response_type=code | SYSTEM (除 scope 外) |

OAuth2 模板参数说明：

- `grant_type` -- 默认值 `authorization_code`，非必填（管理员可改）
- `response_type` -- 默认值 `code`，非必填

## 实现步骤

### 1. 新建实体和 Repository ✅

- 新建 [`McpAuthTypeTemplateEntity`](abc-mcp-gateway/src/main/java/com/abc/mcp/entity/McpAuthTypeTemplateEntity.java)
  - 继承 `SuperEntity`，包含 `authType`、`authTypeName`、`description`、`paramTemplates`(JSON TEXT)、`isBuiltin`、`sortOrder` 字段
  - JPA 唯一约束 `(tenant_id, auth_type)`
- 新建 [`McpAuthTypeTemplateRepository`](abc-mcp-gateway/src/main/java/com/abc/mcp/repository/McpAuthTypeTemplateRepository.java)
  - `findByTenantIdAndAuthType()`
  - `findByTenantIdOrderBySortOrderAsc()`
  - `existsByTenantIdAndAuthType()`
  - `findAllByOrderBySortOrderAsc()`
  - `countByTenantId()`

### 2. 新增枚举值 BEARER_TOKEN ✅

- 在 [`McpServerAuthType`](abc-mcp-gateway/src/main/java/com/abc/mcp/enums/McpServerAuthType.java) 中增加 `BEARER_TOKEN`
- 枚举值：`NONE`, `API_KEY`, `BASIC`, `OAUTH2`, `BEARER_TOKEN`

### 3. 改造 Service 层 ✅

> **注意**：已移除启动自动初始化（`AuthTemplateDataInitializer` 已删除），改为通过管理端 API 手动触发初始化。

修改 [`McpAuthParamConfigServiceImpl`](abc-mcp-gateway/src/main/java/com/abc/mcp/service/impl/McpAuthParamConfigServiceImpl.java)：

- **`getAuthTypeTemplate(String authType)`** -- 优先从数据库查询模板（`templateRepository.findByTenantIdAndAuthType`），查不到则 fallback 到内置 `buildXxxTemplate()` 方法（保留作为兜底）
- **`getAllTemplates()`** -- 从数据库查询所有模板；若数据库为空则 fallback 返回 5 种内置默认模板
- **`saveTemplate(AuthConfigTemplateResponse template)`** -- 保存/更新模板到数据库，新建模板 `isBuiltin=false`
- **`deleteTemplate(String authType)`** -- 删除模板，内置模板（`isBuiltin=true`）不可删除
- **`initDefaultTemplates()`** -- 手动初始化 5 种内置标准模板，已存在的类型跳过不覆盖
- 新增 `buildBearerTokenTemplate()` 内置模板构建方法
- 更新 `buildOAuth2Template()` 增加 `grant_type` 和 `response_type` 参数
- 新增辅助方法：`toTemplateResponse()`、`getBuiltinTemplate()`、`serializeParamTemplates()`、`deserializeParamTemplates()`

### 4. 增强 Controller ✅

在 [`McpAuthParamConfigController`](abc-mcp-gateway/src/main/java/com/abc/mcp/controller/McpAuthParamConfigController.java) 中新增以下 API：

| 方法 | 路径 | 说明 |

|------|------|------|

| `GET` | `/mcp/admin/auth-params/templates` | 获取所有模板列表 |

| `GET` | `/mcp/admin/auth-params/templates/{authType}` | 获取指定类型的模板（含参数定义） |

| `POST` | `/mcp/admin/auth-params/templates` | 新增自定义模板 |

| `PUT` | `/mcp/admin/auth-params/templates/{authType}` | 更新模板（含修改参数定义） |

| `DELETE` | `/mcp/admin/auth-params/templates/{authType}` | 删除模板（内置模板不可删除） |

| `POST` | `/mcp/admin/auth-params/templates/init` | 一键初始化 5 种内置标准模板（已存在跳过） |

## 模板与 MCP Server 创建的关系

模板仅用于**前端展示和预填充**，创建 MCP Server 时不传模版 ID，按标准自定义参数方式提交：

### 前端交互流程

```
1. 管理员选择 authType → 前端调用 GET /mcp/admin/auth-params/templates/{authType} 获取模板参数
2. 前端展示模板参数列表，管理员可增加/删除/修改任意参数
3. 管理员提交 POST /mcp/admin/servers，将最终参数列表放入 authParamConfigs 字段
4. 后端将 authParamConfigs 写入 t_mcp_auth_param_config 表
```

### 后端处理逻辑（在 McpServerServiceImpl.createServer 中）

- 若 `request.getAuthParamConfigs()` 不为空 → 调用 `saveServerParamConfigs()` 存储用户编辑后的参数
- 若 `request.getAuthParamConfigs()` 为空且 `authType != NONE` → 调用 `applyAuthTemplate()` 自动应用默认模板
- `authType == NONE` → 不创建任何参数定义

### 涉及的 DTO 变更

- **`McpServerCreateRequest`** 增加 `authParamConfigs` 字段（`List<AuthParamConfigRequest>`，`@Valid` 级联校验）
- **`McpServerResponse`** 增加 `authParamConfigs` 字段（`List<AuthParamConfigResponse>`），查询时返回参数定义

## 已删除的文件

- `AuthTemplateDataInitializer.java`（原 `abc-mcp-gateway/src/main/java/com/abc/mcp/config/AuthTemplateDataInitializer.java`）-- 启动自动初始化已移除，改为手动 API 触发

## 注意事项

1. 内置模板（`isBuiltin=true`）不可删除，但可以编辑更新
2. 自定义模板（`isBuiltin=false`）可删除
3. `initDefaultTemplates()` 接口是幂等的，已存在的模板不会被覆盖
4. `getAuthTypeTemplate()` 和 `getAllTemplates()` 始终有 fallback 兜底，即使数据库中没有模板数据也能正常工作
5. 模板参数结构（`AuthParamConfigRequest`）与创建 Server 时提交的 `authParamConfigs` 结构完全一致，前端可直接使用