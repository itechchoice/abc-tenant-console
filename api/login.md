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