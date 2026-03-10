# http 模块说明

`src/http/` 负责统一管理 HTTP 客户端，目前只有一个核心文件：`client.ts`。

## client.ts 的职责

`apiClient` 是全局 axios 单例，负责：

1. 统一设置 `baseURL`
2. 统一请求超时
3. 自动注入 Bearer Token
4. 统一处理 401 并跳转登录页
5. 统一返回 `response.data`

## 使用约定

- 业务代码应统一使用 `apiClient`
- 不建议在业务组件中直接写裸 `axios.create()` 或重复配置请求头
- API 路径使用业务路径即可，例如 `/sessions`、`/tasks`

真正的 `/api/v1` 前缀重写由 `vite.config.js` 中的代理完成。
