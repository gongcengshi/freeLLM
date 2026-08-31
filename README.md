# FreeLLM

[English](#english) | [中文](#中文)

---

## English

Free LLM API aggregation gateway with OpenAI-compatible endpoint. Aggregate free tiers from multiple AI providers behind a single API, with smart routing, auto-fallback, and a web-based admin panel.

### Features

- **OpenAI-Compatible API** - Drop-in replacement for OpenAI SDK
- **8 Provider Adapters** - Google Gemini, Groq, NVIDIA NIM, OpenRouter, DeepSeek, Cerebras, SambaNova, HuggingFace
- **Smart Routing** - 7 strategies: priority, balanced, fastest, smartest, cheapest, random, round-robin
- **Auto-Fallback** - Automatic retry with cooldown on provider failures
- **Web Admin Panel** - React-based dashboard with real-time monitoring
- **Landing Page** - Built-in API test console
- **Encrypted Storage** - AES-256-GCM encryption for API keys
- **Proxy Support** - Works behind corporate proxies (Clash, V2Ray, etc.)
- **Request Caching** - Reduce redundant API calls
- **Usage Statistics** - Track token usage and latency

### Quick Start

```bash
# Clone
git clone https://github.com/gongcengshi/freeLLM.git
cd freeLLM

# Install
npm install

# Setup (creates database with default providers)
npm run setup

# Start
npm run dev
```

Server runs at `http://localhost:3001`

### Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=3001
ENCRYPTION_KEY=your-64-char-hex-key
PROXY_API_KEY=freellm-your-proxy-key
HTTP_PROXY=http://127.0.0.1:7890   # if behind proxy
HTTPS_PROXY=http://127.0.0.1:7890  # if behind proxy
```

### API Usage

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3001/v1",
    api_key="freellm-your-proxy-key"
)

response = client.chat.completions.create(
    model="deepseek/deepseek-v4-flash",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)
```

### Supported Models

| Provider | Models |
|----------|--------|
| Google Gemini | gemini-2.0-flash, gemini-2.5-flash, gemini-2.5-pro |
| Groq | qwen3.8-27b, qwen3.6-27b, allam-2-7b, gpt-oss-120b |
| DeepSeek | deepseek-v4-flash, deepseek-v4-pro |
| NVIDIA NIM | nemotron-3-super-120b, llama-3.3-70b, deepseek-r1 |
| OpenRouter | llama-3.3-70b:free, gemini-2.0-flash:free |
| Cerebras | llama-3.3-70b, llama-3.1-8b |
| SambaNova | Meta-Llama-3.3-70B, DeepSeek-V3 |
| HuggingFace | Llama-3.3-70B, Qwen2.5-72B |

### Tech Stack

- **Runtime**: Node.js >= 20, TypeScript 5.x
- **Server**: Express.js
- **Database**: SQLite (better-sqlite3)
- **Frontend**: React + Vite + TailwindCSS
- **Testing**: Vitest

### License

MIT

---

## 中文

免费 LLM API 聚合网关，提供 OpenAI 兼容接口。将多个 AI 服务商的免费额度聚合到一个 API 后面，支持智能路由、自动降级和 Web 管理面板。

### 功能特性

- **OpenAI 兼容 API** - 可直接替换 OpenAI SDK
- **8 个服务商适配器** - Google Gemini、Groq、NVIDIA NIM、OpenRouter、DeepSeek、Cerebras、SambaNova、HuggingFace
- **智能路由** - 7 种策略：priority、balanced、fastest、smartest、cheapest、random、round-robin
- **自动降级** - 服务商失败时自动重试并冷却
- **Web 管理面板** - React 仪表盘，实时监控
- **落地页** - 内置 API 测试控制台
- **加密存储** - AES-256-GCM 加密 API 密钥
- **代理支持** - 支持企业代理（Clash、V2Ray 等）
- **请求缓存** - 减少重复 API 调用
- **使用统计** - 追踪 Token 用量和延迟

### 快速开始

```bash
# 克隆
git clone https://github.com/gongcengshi/freeLLM.git
cd freeLLM

# 安装
npm install

# 初始化（创建数据库和默认服务商）
npm run setup

# 启动
npm run dev
```

服务运行在 `http://localhost:3001`

### 配置

复制 `.env.example` 为 `.env` 并配置：

```env
PORT=3001
ENCRYPTION_KEY=你的64位十六进制密钥
PROXY_API_KEY=freellm-你的代理密钥
HTTP_PROXY=http://127.0.0.1:7890   # 如在代理后面
HTTPS_PROXY=http://127.0.0.1:7890  # 如在代理后面
```

### API 使用

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3001/v1",
    api_key="freellm-你的代理密钥"
)

response = client.chat.completions.create(
    model="deepseek/deepseek-v4-flash",
    messages=[{"role": "user", "content": "你好！"}]
)
print(response.choices[0].message.content)
```

### 支持的模型

| 服务商 | 模型 |
|--------|------|
| Google Gemini | gemini-2.0-flash, gemini-2.5-flash, gemini-2.5-pro |
| Groq | qwen3.8-27b, qwen3.6-27b, allam-2-7b, gpt-oss-120b |
| DeepSeek | deepseek-v4-flash, deepseek-v4-pro |
| NVIDIA NIM | nemotron-3-super-120b, llama-3.3-70b, deepseek-r1 |
| OpenRouter | llama-3.3-70b:free, gemini-2.0-flash:free |
| Cerebras | llama-3.3-70b, llama-3.1-8b |
| SambaNova | Meta-Llama-3.3-70B, DeepSeek-V3 |
| HuggingFace | Llama-3.3-70B, Qwen2.5-72B |

### 技术栈

- **运行时**: Node.js >= 20, TypeScript 5.x
- **服务器**: Express.js
- **数据库**: SQLite (better-sqlite3)
- **前端**: React + Vite + TailwindCSS
- **测试**: Vitest

### 许可证

MIT
