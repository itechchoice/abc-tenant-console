### 3.2.1 流式对话 (SSE)

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