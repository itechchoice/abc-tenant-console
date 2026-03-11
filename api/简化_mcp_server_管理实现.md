---
name: 简化 MCP Server 管理实现
overview: 在 abc-mcp-gateway 中实现简化的 MCP Server 管理功能，包括管理端和用户端接口。简化表结构，只保留必须字段，去除版本信息，保留多租户配置和分类功能。
todos:
  - id: "1"
    content: 更新 McpServerEntity，简化字段，添加 supportsStreaming、runtimeMode、icon，移除 serverCode 和 version，使用 endpoint 字段
    status: completed
  - id: "2"
    content: 创建 CategoryEntity 和 McpServerCategoryEntity 实体类
    status: completed
  - id: "3"
    content: 创建 McpTenantServerConnectionEntity 实体类
    status: completed
  - id: "4"
    content: 创建所有 Repository 接口（Category, ServerCategory, TenantConnection）
    status: completed
    dependencies:
      - "2"
      - "3"
  - id: "5"
    content: 创建 DTO 类（CreateRequest, UpdateRequest, Response, CatalogResponse）
    status: completed
    dependencies:
      - "1"
  - id: "6"
    content: 实现 Service 层（MCPServerService, CategoryService, ServerCategoryService, TenantConnectionService）
    status: completed
    dependencies:
      - "4"
      - "5"
  - id: "7"
    content: 创建 MCPServerManagerController（管理端接口）
    status: completed
    dependencies:
      - "6"
  - id: "8"
    content: 创建 MCPServerUserController（用户端接口）
    status: completed
    dependencies:
      - "6"
  - id: "9"
    content: 更新 McpSyncService 以适配新的实体结构
    status: completed
    dependencies:
      - "1"
  - id: "10"
    content: 实现 CategoryEntity 管理功能（DTO、Service、Controller）
    status: completed
    dependencies:
      - "2"
---

# 简化 MCP Server 管理实现计划

## 目标

在 `abc-mcp-gateway` 中实现简化的 MCP Server 管理功能，参考 `tenant-manager` 的实现，但大幅简化表结构和功能。

## 表结构设计

### 0. 基础实体类

所有实体类继承 `SuperEntity`，包含以下通用字段：
- `id` (String, UUID) - 主键
- `tenant_id` (String) - 租户ID
- `created_at` (Instant) - 创建时间
- `updated_at` (Instant) - 更新时间

`SuperEntity` 使用 `@PrePersist` 和 `@PreUpdate` 自动设置时间戳。

### 1. 核心表结构

#### mcp_servers（简化版）

**必须字段：**

- `id` (String, PK, UUID) - 继承自 SuperEntity
- `name` (String, 名称)
- `description` (TEXT, 描述)
- `endpoint` (String, 连接地址)
- `auth_type` (String, 认证类型: none/api_key/basic/oauth2)
- `auth_config` (JSONB, 认证配置)
- `supports_streaming` (Boolean, 是否支持流式)
- `runtime_mode` (RuntimeMode 枚举, 运行模式: REMOTE/LOCAL)
- `icon` (String, 图标URL)
- `status` (String, 状态: ACTIVE/DISABLED)
- `tenant_id` (String, 租户ID) - 继承自 SuperEntity
- `created_at` (Instant, 创建时间) - 继承自 SuperEntity
- `updated_at` (Instant, 更新时间) - 继承自 SuperEntity

**去除的字段：**

- server_code (不需要唯一标识)
- version, versionDescription
- shortDescription
- author, license, homepage, repoUrl
- tags, supportedLocales
- mcpProtocolVersion
- serverType
- connectTimeoutMs, readTimeoutMs
- maxConcurrentRequests, rateLimit, maxRequestSize, maxResponseSize
- arn

#### mcp_server_tools（已存在，保持不变）

- `id`, `server_id`, `tenant_id`, `name`, `description`, `parameters`, `status`, `created_at`

#### mcp_categories（分类表）

- `id` (继承自 SuperEntity)
- `code` (唯一)
- `tenant_id` (继承自 SuperEntity)
- `created_at`, `updated_at` (继承自 SuperEntity)

#### mcp_server_categories（关联表）

- `id`, `server_id`, `category_id`, `tenant_id`, `created_at`, `updated_at`

#### mcp_tenant_server_connections（租户连接配置表）

- `id`, `server_id`, `tenant_id`, `user_id` (可为空), `auth_type`, `connection_name`, `credentials` (JSONB), `virtual_server_id`, `status`, `oauth_state`, `is_test`

#### mcp_tenant_server_config_values（配置值表，可选）

- `id`, `connection_id`, `server_id`, `tenant_id`, `user_id`, `key_name`, `value` (JSONB), `source`, `status`

## 实现步骤

### 阶段1：实体类和表结构

1. **更新 McpServerEntity** ([abc-mcp-gateway/src/main/java/com/abc/mcp/entity/McpServerEntity.java](abc-mcp-gateway/src/main/java/com/abc/mcp/entity/McpServerEntity.java))

- 简化字段，只保留必须字段
- 添加 `supportsStreaming`, `runtimeMode`, `icon` 字段
- 移除 `serverCode`, `version` 相关字段
- 添加与工具、分类的关联关系

2. **创建 CategoryEntity** ([abc-mcp-gateway/src/main/java/com/abc/mcp/entity/CategoryEntity.java](abc-mcp-gateway/src/main/java/com/abc/mcp/entity/CategoryEntity.java))

- 包含 `code` 字段和与服务器的关联

3. **创建 MCPServerCategoryEntity** ([abc-mcp-gateway/src/main/java/com/abc/mcp/entity/McpServerCategoryEntity.java](abc-mcp-gateway/src/main/java/com/abc/mcp/entity/McpServerCategoryEntity.java))

- 服务器与分类的多对多关联表

4. **创建 MCPTenantServerConnectionEntity** ([abc-mcp-gateway/src/main/java/com/abc/mcp/entity/McpTenantServerConnectionEntity.java](abc-mcp-gateway/src/main/java/com/abc/mcp/entity/McpTenantServerConnectionEntity.java))

- 租户级连接配置实体

### 阶段2：Repository 层

1. **更新 McpServerRepository**

- 添加按状态、租户查询
- 添加按分类查询
- 添加按 runtimeMode 查询

2. **创建 CategoryRepository**
3. **创建 McpServerCategoryRepository**
4. **创建 McpTenantServerConnectionRepository**

### 阶段3：DTO 类

1. **创建 MCPServerCreateRequest** - 简化的创建请求
2. **创建 MCPServerUpdateRequest** - 简化的更新请求
3. **创建 MCPServerResponse** - 简化的响应DTO
4. **创建 UserMCPServerCatalogResponse** - 用户端目录响应
5. **创建 CategoryCreateRequest** - 分类创建请求
6. **创建 CategoryUpdateRequest** - 分类更新请求
7. **创建 CategoryResponse** - 分类响应DTO

### 阶段4：Service 层

1. **创建 MCPServerService**

- `createServer()` - 创建服务器
- `updateServer()` - 更新服务器
- `deleteServer()` - 删除服务器
- `getServerById()` - 按ID查询
- `getServers()` - 分页查询（支持按runtimeMode过滤）

2. **创建 CategoryService**

- 分类的CRUD操作
- `findById()` - 根据ID查找
- `existsByCode()` - 检查code是否存在
- `delete()` - 删除分类

3. **创建 MCPServerCategoryService**

- 管理服务器与分类的关联

4. **创建 MCPTenantServerConnectionService**

- 租户连接配置的CRUD

### 阶段5：Controller 层

1. **创建 MCPServerManagerController** (管理端)

- `/api/v1/mcp/admin/servers` - 管理端接口
- CRUD操作
- 分类关联管理
- 连接配置管理

2. **创建 CategoryController** (管理端)

- `/api/v1/mcp/admin/categories` - 分类管理接口
- CRUD操作
- 根据code查询

3. **创建 MCPServerUserController** (用户端)

- `/api/v1/mcp/user/mcp-servers` - 用户端接口
- 目录查询
- 服务器详情查询

### 阶段6：工具同步

- 更新 `McpSyncService` 以适配新的实体结构

## 关键简化点

1. **去除版本管理**：不再区分 server 和 version，直接使用 server
2. **去除 serverCode**：不需要唯一标识符，直接使用数据库主键ID
3. **简化元数据**：去除 author, license, homepage 等非核心字段，但保留 icon
4. **去除能力限制**：去除 rateLimit, maxRequestSize 等高级配置
5. **保留核心功能**：保留分类、多租户配置、流式支持、runtimeMode、icon

## 文件清单

### 新增文件

- `entity/CategoryEntity.java`
- `entity/McpServerCategoryEntity.java`
- `entity/McpTenantServerConnectionEntity.java`
- `repository/CategoryRepository.java`
- `repository/McpServerCategoryRepository.java`
- `repository/McpTenantServerConnectionRepository.java`
- `dto/MCPServerCreateRequest.java`
- `dto/MCPServerUpdateRequest.java`
- `dto/MCPServerResponse.java`
- `dto/UserMCPServerCatalogResponse.java`
- `dto/CategoryCreateRequest.java`
- `dto/CategoryUpdateRequest.java`
- `dto/CategoryResponse.java`
- `service/MCPServerService.java`
- `service/impl/MCPServerServiceImpl.java`
- `service/CategoryService.java`
- `service/impl/CategoryServiceImpl.java`
- `service/MCPServerCategoryService.java`
- `service/impl/MCPServerCategoryServiceImpl.java`
- `service/MCPTenantServerConnectionService.java`
- `service/impl/MCPTenantServerConnectionServiceImpl.java`
- `controller/MCPServerManagerController.java`
- `controller/MCPServerUserController.java`
- `controller/CategoryController.java`
- `enums/RuntimeMode.java` - 运行模式枚举

### 修改文件

- `entity/McpServerEntity.java` - 简化字段
- `repository/McpServerRepository.java` - 添加查询方法
- `service/McpSyncService.java` - 适配新结构

## 注意事项

1. **实体类基础字段**：所有实体类继承 `SuperEntity`，包含 `id`, `tenantId`, `createdAt`, `updatedAt` 字段。ID 类型为 `String`，使用 `IdGenerator.uuid()` 生成。租户ID类型为 `String`。
2. 认证类型使用枚举：`NONE`, `API_KEY`, `BASIC`, `OAUTH2` (`McpServerAuthType`)
3. 状态使用枚举：`ACTIVE`, `DISABLED` (`McpServerStatus`)
4. 运行模式使用枚举：`LOCAL`, `REMOTE` (`RuntimeMode`)
5. 多租户支持：所有查询都需要过滤 tenantId
6. 不再需要 serverCode 相关验证和查询
7. 使用 `endpoint` 字段表示 MCP Server 连接地址（数据库列名：`endpoint`）