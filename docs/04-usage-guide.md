# FreeLLM 使用说明

## 目录

- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [API 使用](#api-使用)
- [管理面板](#管理面板)
- [Provider 配置](#provider-配置)
- [路由策略](#路由策略)
- [高级功能](#高级功能)
- [常见问题](#常见问题)

---

## 快速开始

### 1. 安装依赖

```bash
cd freeLLM
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置 Proxy API Key：

```env
PROXY_API_KEY=freellm-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

生成随机 Key 的方法：

```bash
npx tsx src/cli.ts generate-key
```

### 3. 初始化数据库和 Provider

```bash
npx tsx src/setup.ts
```

### 4. 启动服务器

```bash
npm run dev
```

服务器默认运行在 `http://localhost:3001`

---

## 配置说明

### 环境变量 (.env)

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3001` | 服务器端口 |
| `HOST` | `0.0.0.0` | 监听地址 |
| `DATA_DIR` | `~/.freellm` | 数据库存储目录 |
| `PROXY_API_KEY` | - | 外部访问的统一 API Key |
| `ADMIN_PASSWORD` | - | Admin 面板密码（空=免认证） |
| `ENCRYPTION_KEY` | - | 密钥加密密钥（空=自动生成） |
| `CORS_ORIGIN` | `*` | 跨域来源 |
| `LOG_LEVEL` | `info` | 日志级别：debug/info/warn/error |
| `RATE_LIMIT_WINDOW_MS` | `60000` | 限流窗口（毫秒） |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | 窗口内最大请求数 |

### Provider API Key

在 `.env` 中添加各 Provider 的密钥：

```env
GOOGLE_API_KEY=AIzaSy...
GROQ_API_KEY=gsk_...
NVIDIA_API_KEY=nvapi-...
OPENROUTER_API_KEY=sk-or-...
DEEPSEEK_API_KEY=sk-...
```

---

## API 使用

### 基本用法 (OpenAI 兼容)

#### Python

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3001/v1",
    api_key="freellm-your-proxy-key"
)

response = client.chat.completions.create(
    model="groq/llama-3.3-70b-versatile",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"}
    ],
    temperature=0.7,
    max_tokens=100
)

print(response.choices[0].message.content)
```

#### curl

```bash
curl http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer freellm-your-proxy-key" \
  -d '{
    "model": "groq/llama-3.3-70b-versatile",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "max_tokens": 100
  }'
```

#### Node.js

```javascript
const response = await fetch('http://localhost:3001/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer freellm-your-proxy-key'
  },
  body: JSON.stringify({
    model: 'groq/llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: 'Hello!' }],
    max_tokens: 100
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

### 流式输出 (Streaming)

```python
stream = client.chat.completions.create(
    model="groq/llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": "Tell me a story"}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

### 指定路由策略

通过 `X-Freellm-Strategy` 头指定路由策略：

```bash
curl http://localhost:3001/v1/chat/completions \
  -H "X-Freellm-Strategy: fastest" \
  -H "Authorization: Bearer freellm-your-proxy-key" \
  -H "Content-Type: application/json" \
  -d '{"model": "auto", "messages": [{"role": "user", "content": "Hi"}]}'
```

### 响应头信息

API 响应包含以下自定义头：

| 头 | 说明 |
|----|------|
| `X-Freellm-Provider` | 实际处理请求的 Provider |
| `X-Freellm-Model` | 实际使用的模型 |
| `X-Freellm-Latency-Ms` | 请求延迟（毫秒） |

---

## 管理面板

### 访问地址

```
http://localhost:3001/admin
```

### Admin API 接口

所有 Admin 接口需要 `Authorization: Bearer <ADMIN_PASSWORD>` 头。

#### Provider 管理

```bash
# 获取所有 Provider
curl http://localhost:3001/admin/providers

# 获取单个 Provider
curl http://localhost:3001/admin/providers/groq

# 添加 Provider
curl -X POST http://localhost:3001/admin/providers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "custom",
    "name": "Custom Provider",
    "type": "openai-compatible",
    "baseUrl": "https://api.example.com/v1",
    "authType": "api-key",
    "models": ["model-1", "model-2"],
    "rateLimits": {"rpm": 60, "rpd": 1000, "tpm": 100000, "tpd": 1000000},
    "features": {"streaming": true, "tools": false, "vision": false, "reasoning": false},
    "enabled": true
  }'

# 删除 Provider
curl -X DELETE http://localhost:3001/admin/providers/custom
```

#### API Key 管理

```bash
# 获取所有 Key
curl http://localhost:3001/admin/api-keys

# 添加 Key
curl -X POST http://localhost:3001/admin/api-keys \
  -H "Content-Type: application/json" \
  -d '{"providerId": "groq", "name": "My Groq Key", "key": "gsk_..."}'

# 删除 Key
curl -X DELETE http://localhost:3001/admin/api-keys/{key-id}
```

#### 日志查询

```bash
# 获取请求日志
curl "http://localhost:3001/admin/logs?limit=50"

# 按 Provider 过滤
curl "http://localhost:3001/admin/logs?providerId=groq"

# 获取统计信息
curl http://localhost:3001/admin/logs/stats

# 每日使用统计
curl "http://localhost:3001/admin/usage/daily?days=7"

# 按模型统计
curl "http://localhost:3001/admin/usage/by-model?days=30"
```

#### 健康检查

```bash
# 检查所有 Provider
curl http://localhost:3001/admin/health

# 检查单个 Provider
curl http://localhost:3001/admin/health/groq
```

#### 密钥验证

```bash
# 验证所有密钥
curl -X POST http://localhost:3001/admin/validate-keys

# 验证指定 Provider 的密钥
curl -X POST http://localhost:3001/admin/validate-keys/groq

# 验证单个密钥
curl -X POST http://localhost:3001/admin/validate-keys/groq/{key-id}
```

#### 模型评分

```bash
curl http://localhost:3001/admin/scores
```

---

## Provider 配置

### 内置 Provider

| Provider | ID | Base URL | 免费模型 |
|----------|-----|----------|----------|
| Google Gemini | `google` | generativelanguage.googleapis.com | gemini-2.0-flash, gemini-2.5-flash |
| Groq | `groq` | api.groq.com | llama-3.3-70b-versatile, mixtral-8x7b |
| NVIDIA NIM | `nvidia` | integrate.api.nvidia.com | nemotron-3-super-120b, llama-3.3-70b |
| OpenRouter | `openrouter` | openrouter.ai | llama-3.3-70b:free, gemini-2.0-flash:free |
| DeepSeek | `deepseek` | api.deepseek.com | deepseek-chat, deepseek-reasoner |
| Cerebras | `cerebras` | api.cerebras.ai | llama-3.3-70b, qwen-2.5-32b |
| SambaNova | `sambanova` | api.sambanova.ai | Meta-Llama-3.3-70B, DeepSeek-V3 |
| HuggingFace | `huggingface` | api-inference.huggingface.co | llama-3.3-70b, qwen2.5-72b |

### 模型命名格式

```
{provider-id}/{model-name}
```

示例：
- `groq/llama-3.3-70b-versatile`
- `google/gemini-2.0-flash`
- `nvidia/meta/llama-3.3-70b-instruct`

### 添加自定义 Provider

通过 Admin API 添加：

```bash
curl -X POST http://localhost:3001/admin/providers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my-provider",
    "name": "My Custom Provider",
    "type": "openai-compatible",
    "baseUrl": "https://api.my-provider.com/v1",
    "authType": "api-key",
    "models": ["model-a", "model-b"],
    "rateLimits": {"rpm": 60, "rpd": 1000, "tpm": 100000, "tpd": 1000000},
    "features": {"streaming": true, "tools": false, "vision": false, "reasoning": false},
    "enabled": true
  }'
```

然后添加 API Key：

```bash
curl -X POST http://localhost:3001/admin/api-keys \
  -H "Content-Type: application/json" \
  -d '{"providerId": "my-provider", "name": "My Key", "key": "sk-..."}'
```

---

## 路由策略

通过 `X-Freellm-Strategy` 请求头指定：

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| `priority` | 按优先级选择（默认） | 通用场景 |
| `balanced` | 综合评分最高 | 平衡质量和速度 |
| `fastest` | 选择延迟最低的 Provider | 需要低延迟 |
| `smartest` | 选择质量评分最高的 Provider | 需要高质量回复 |
| `cheapest` | 选择成本最低（所有免费 Provider） | 节省配额 |
| `random` | 随机选择 | 负载分散 |
| `round-robin` | 轮询选择 | 均匀分配请求 |

示例：

```bash
# 使用最快策略
curl -H "X-Freellm-Strategy: fastest" \
     -H "Authorization: Bearer freellm-xxx" \
     http://localhost:3001/v1/chat/completions \
     -d '{"model": "auto", "messages": [{"role": "user", "content": "Hi"}]}'
```

---

## 高级功能

### WebSocket 实时监控

连接 WebSocket 端点接收实时事件：

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
  // { type: 'request_complete', data: { model, providerId, latencyMs, tokens, status } }
  // { type: 'request_error', data: { model, providerId, error } }
};
```

### 请求缓存

相同的非流式请求会在 30 秒内返回缓存结果。

### 自动故障转移

请求失败时自动尝试其他 Provider，最多 3 次。

### 密钥冷却

当 Provider 返回 429 (Rate Limit) 时，对应密钥自动冷却 60 秒。

### 健康检查

后台每 5 分钟检查所有 Provider 状态，更新模型评分。

---

## 常见问题

### Q: 启动报错 `EADDRINUSE`

端口被占用，先杀掉旧进程：

```powershell
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Q: API 返回 `No available providers`

需要先配置 Provider 和 API Key：

```bash
# 1. 运行初始化
npx tsx src/setup.ts

# 2. 或通过 Admin API 手动添加
curl -X POST http://localhost:3001/admin/api-keys \
  -H "Content-Type: application/json" \
  -d '{"providerId": "groq", "name": "Groq Key", "key": "gsk_your_key_here"}'
```

### Q: 如何修改端口

编辑 `.env` 文件：

```env
PORT=8080
```

### Q: 如何启用 Admin 认证

编辑 `.env` 文件：

```env
ADMIN_PASSWORD=your-secure-password
```

### Q: 数据库存储位置

默认存储在 `~/.freellm/freellm.db`，可通过 `DATA_DIR` 环境变量修改。

### Q: 如何查看请求日志

```bash
# 查看最近 100 条日志
curl "http://localhost:3001/admin/logs?limit=100"

# 查看统计
curl http://localhost:3001/admin/logs/stats
```

---

## 项目结构

```
freeLLM/
├── src/
│   ├── types/          # 类型定义
│   ├── db/             # 数据库操作
│   ├── providers/      # Provider 适配器 (8个)
│   ├── router/         # 路由引擎
│   ├── services/       # 业务服务
│   ├── server/         # Express 服务器
│   └── utils/          # 工具函数
├── client/             # React 管理面板
├── tests/              # 单元测试
├── docs/               # 文档
├── .env.example        # 环境变量模板
└── package.json
```
