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