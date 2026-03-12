# http 模块说明

`src/http/` 负责统一管理 HTTP 客户端，核心入口是 `client.ts`。

## client.ts 的职责

`client.ts` 负责：

1. 按服务域生成 axios client
2. 统一请求超时
3. 自动注入 Bearer Token
4. 统一处理 401 并跳转登录页
5. 统一返回 `response.data`

当前已内置以下 client：

- `authApiClient` -> `/auth-server`
- `engineApiClient` -> `/engine`
- `llmGatewayApiClient` -> `/llm-gateway`
- `mcpApiClient` -> `/mcp-gateway`
- `apiClient` -> `engineApiClient` 的兼容别名

## 使用约定

- 业务代码应按接口归属服务使用对应的 client
- 不建议在业务组件中直接写裸 `axios.create()` 或重复配置请求头
- API 路径使用业务路径即可，例如 `/sessions`、`/tasks`

推荐映射如下：

- 登录鉴权 -> `authApiClient`
- 会话、任务、工作流 -> `engineApiClient`
- 模型、Provider、Quota -> `llmGatewayApiClient`
- MCP 管理、MCP 用户侧接口 -> `mcpApiClient`

开发环境下，真正的 `/api/v1` 前缀重写由 `vite.config.js` 中的代理完成，最终请求会自动落到：

- `/tenant-console-api/auth-server/...` -> `/api/v1/auth-server/...`
- `/tenant-console-api/engine/...` -> `/api/v1/engine/...`
- `/tenant-console-api/llm-gateway/...` -> `/api/v1/llm-gateway/...`
- `/tenant-console-api/mcp-gateway/...` -> `/api/v1/mcp-gateway/...`
