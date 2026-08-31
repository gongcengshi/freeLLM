# freeLLM 需求规格说明书

> 版本: 1.0  
> 日期: 2026-08-30  
> 状态: 待确认

---

## 1. 引言

### 1.1 项目背景

当前多个 AI 提供商（Google、NVIDIA、Groq、DeepSeek 等）提供免费 API 额度，但分散在不同平台，用户需要管理多个 API Key，且各平台有独立的速率限制和使用规则。freeLLM 旨在将这些分散的免费额度聚合为统一的 API 端点，降低使用门槛。

### 1.2 项目目标

1. 提供单一的 OpenAI 兼容 API 端点，聚合多个免费 LLM 提供商
2. 自动管理请求路由、故障转移和速率限制
3. 提供直观的管理界面，方便用户配置和监控
4. 保持轻量级、易部署、易使用

### 1.3 目标用户

| 用户类型 | 需求特征 |
|----------|----------|
| 个人开发者 | 免费使用 AI 能力，个人学习和实验 |
| 学生/研究者 | 低成本进行 AI 研究和实验 |
| 独立开发者 | 在产品原型阶段降低 API 成本 |
| 小型团队 | 共享免费额度，协作开发 |

### 1.4 参考资料

| 项目 | 参考内容 |
|------|----------|
| free-claude-code | 本地代理架构、提供商抽象、故障转移机制 |
| freellmapi | 统一 API 设计、密钥加密、路由策略、使用追踪 |
| OmniRoute | 多策略路由、弹性机制、Token 压缩、桌面应用 |
| GPT_API_free | 国内加速、限流策略、付费补贴模式 |

---

## 2. 系统架构

### 2.1 架构概述

freeLLM 采用本地代理服务器架构，核心组件包括：

```
┌─────────────────────────────────────────────────────────────┐
│                      freeLLM Gateway                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  API Server  │  │   Router     │  │  Admin Dashboard │  │
│  │  (Express)   │  │  (Strategy)  │  │  (React + Vite)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────┘  │
│         │                 │                                 │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────────────────┐  │
│  │  Auth Layer  │  │  Rate Limiter│  │  Health Checker  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────┘  │
│         │                 │                                 │
│  ┌──────┴─────────────────┴──────────────────────────────┐  │
│  │              Provider Adapters                         │  │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │  │
│  │  │Gemini│ │Groq │ │NIM  │ │OpenR│ │DeepS│ │ ... │   │  │
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│         │                                                   │
│  ┌──────┴───────┐  ┌──────────────┐                        │
│  │   SQLite DB  │  │  Key Store   │                        │
│  │  (Logs/Stats)│  │  (Encrypted) │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              External LLM Providers                         │
│  Google │ Groq │ NVIDIA │ OpenRouter │ DeepSeek │ ...      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 模块划分

```
freellm/
├── src/
│   ├── server/                    # API 服务器
│   │   ├── index.ts              # 服务器入口
│   │   ├── routes/               # 路由定义
│   │   │   ├── v1/               # OpenAI 兼容 API
│   │   │   │   ├── chat.ts       # /v1/chat/completions
│   │   │   │   ├── models.ts     # /v1/models
│   │   │   │   └── completions.ts # /v1/completions
│   │   │   └── admin/            # 管理 API
│   │   │       ├── keys.ts       # 密钥管理
│   │   │       ├── providers.ts  # 提供商管理
│   │   │       └── settings.ts   # 系统设置
│   │   ├── middleware/           # 中间件
│   │   │   ├── auth.ts          # 认证
│   │   │   ├── rateLimit.ts     # 速率限制
│   │   │   └── cors.ts          # CORS
│   │   └── handlers/            # 请求处理器
│   │       ├── chatHandler.ts   # 聊天补全
│   │       └── errorHandler.ts  # 错误处理
│   ├── router/                    # 路由引擎
│   │   ├── index.ts             # 路由器入口
│   │   ├── strategies/          # 路由策略
│   │   │   ├── priority.ts      # 优先级策略
│   │   │   ├── balanced.ts      # 均衡策略
│   │   │   ├── fastest.ts       # 最快策略
│   │   │   ├── smartest.ts      # 智能策略
│   │   │   └── index.ts         # 策略注册
│   │   ├── fallback.ts          # 故障转移
│   │   └── scorer.ts            # 模型评分
│   ├── providers/                 # 提供商适配器
│   │   ├── base.ts              # 基类
│   │   ├── google.ts            # Google Gemini
│   │   ├── groq.ts              # Groq
│   │   ├── nvidia.ts            # NVIDIA NIM
│   │   ├── openrouter.ts        # OpenRouter
│   │   ├── deepseek.ts          # DeepSeek
│   │   ├── siliconflow.ts       # 硅基流动
│   │   └── index.ts             # 提供商注册
│   ├── services/                  # 核心服务
│   │   ├── keyManager.ts        # 密钥管理
│   │   ├── rateLimiter.ts       # 速率限制追踪
│   │   ├── healthChecker.ts     # 健康检查
│   │   ├── analytics.ts         # 使用分析
│   │   └── cache.ts             # 响应缓存
│   ├── db/                        # 数据库
│   │   ├── core.ts              # SQLite 连接
│   │   ├── migrations/          # 数据库迁移
│   │   ├── keys.ts              # 密钥表操作
│   │   ├── logs.ts              # 日志表操作
│   │   └── settings.ts          # 设置表操作
│   ├── types/                     # 类型定义
│   │   ├── provider.ts          # 提供商类型
│   │   ├── model.ts             # 模型类型
│   │   └── request.ts           # 请求/响应类型
│   └── utils/                     # 工具函数
│       ├── crypto.ts            # 加密工具
│       ├── logger.ts            # 日志工具
│       └── validator.ts         # 验证工具
├── client/                        # Admin 管理面板
│   ├── src/
│   │   ├── App.tsx              # 应用入口
│   │   ├── pages/               # 页面
│   │   │   ├── Dashboard.tsx    # 仪表盘
│   │   │   ├── Keys.tsx         # 密钥管理
│   │   │   ├── Providers.tsx    # 提供商配置
│   │   │   ├── Models.tsx       # 模型列表
│   │   │   ├── Logs.tsx         # 请求日志
│   │   │   └── Settings.tsx     # 系统设置
│   │   └── components/          # 组件
│   └── index.html
├── tests/                         # 测试
├── docs/                          # 文档
├── package.json
├── tsconfig.json
└── README.md
```

### 2.3 技术栈详细说明

| 组件 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 运行时 | Node.js | >= 20 | LTS 版本 |
| 语言 | TypeScript | 5.x | strict 模式 |
| API 框架 | Express | 4.x | 轻量级，生态丰富 |
| 数据库 | better-sqlite3 | latest | 同步 SQLite 驱动 |
| 前端框架 | React | 18.x | 管理面板 |
| 构建工具 | Vite | 5.x | 快速开发体验 |
| UI 组件 | shadcn/ui | latest | 基于 Radix UI |
| 样式 | TailwindCSS | 3.x | 原子化 CSS |
| 测试 | Vitest | latest | 快速单元测试 |
| 包管理 | pnpm | 8.x | 高效包管理 |
| 代码规范 | ESLint | 9.x | 代码质量 |
| 格式化 | Prettier | 3.x | 代码格式 |

---

## 3. 功能需求详细说明

### 3.1 核心 API 功能

#### 3.1.1 聊天补全 API

**端点**: `POST /v1/chat/completions`

**功能描述**: 提供 OpenAI 兼容的聊天补全 API，支持流式和非流式响应。

**请求格式**:
```json
{
  "model": "auto",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**响应格式** (非流式):
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "google/gemini-2.0-flash",
  "choices": [{
    "index": 0,
    "message": {"role": "assistant", "content": "Hello!"},
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 5,
    "total_tokens": 15
  },
  "x-freellm-provider": "google",
  "x-freellm-model": "gemini-2.0-flash",
  "x-freellm-latency-ms": 234
}
```

**特殊模型 ID**:
- `auto`: 自动选择最优模型
- `auto/fast`: 优先选择最快模型
- `auto/smart`: 优先选择最智能模型
- `auto/cheap`: 优先选择最便宜模型
- `<provider>/<model>`: 指定提供商和模型

**流式响应**:
- 支持 SSE (Server-Sent Events) 流式输出
- 每个 chunk 包含 `delta` 字段
- 结束时发送 `[DONE]` 标记

#### 3.1.2 模型列表 API

**端点**: `GET /v1/models`

**功能描述**: 返回所有可用模型列表。

**响应格式**:
```json
{
  "object": "list",
  "data": [
    {
      "id": "google/gemini-2.0-flash",
      "object": "model",
      "created": 1234567890,
      "owned_by": "google",
      "free": true,
      "max_tokens": 1048576,
      "providers": ["google", "openrouter"]
    }
  ]
}
```

#### 3.1.3 健康检查 API

**端点**: `GET /health`

**响应格式**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "providers": {
    "total": 8,
    "healthy": 6,
    "degraded": 1,
    "unhealthy": 1
  }
}
```

### 3.2 提供商适配器

#### 3.2.1 适配器接口

所有提供商适配器必须实现以下接口：

```typescript
interface ProviderAdapter {
  id: string;
  name: string;
  baseUrl: string;
  
  // 初始化
  initialize(config: ProviderConfig): Promise<void>;
  
  // 核心方法
  chatCompletion(request: ChatRequest, apiKey: string): Promise<ChatResponse>;
  streamChatCompletion(request: ChatRequest, apiKey: string): AsyncGenerator<ChatChunk>;
  
  // 辅助方法
  listModels(apiKey: string): Promise<Model[]>;
  validateKey(apiKey: string): Promise<boolean>;
  
  // 健康检查
  healthCheck(apiKey: string): Promise<HealthStatus>;
}
```

#### 3.2.2 提供商配置

每个提供商需要配置：

```typescript
interface ProviderConfig {
  id: string;
  name: string;
  type: 'openai-compatible' | 'custom';
  baseUrl: string;
  authType: 'api-key' | 'bearer' | 'oauth';
  models: ModelConfig[];
  rateLimits: {
    rpm: number;   // 每分钟请求数
    rpd: number;   // 每天请求数
    tpm: number;   // 每分钟 Token 数
    tpd: number;   // 每天 Token 数
  };
  features: {
    streaming: boolean;
    tools: boolean;
    vision: boolean;
    reasoning: boolean;
  };
}
```

#### 3.2.3 已规划提供商

| 提供商 | 类型 | 认证方式 | 特殊说明 |
|--------|------|----------|----------|
| Google Gemini | OpenAI 兼容 | API Key | 免费层最慷慨 |
| Groq | OpenAI 兼容 | API Key | 速度最快 |
| NVIDIA NIM | OpenAI 兼容 | API Key | 100+ 模型免费 |
| OpenRouter | OpenAI 兼容 | API Key | 免费模型聚合 |
| DeepSeek | OpenAI 兼容 | API Key | 国内直连 |
| Cerebras | OpenAI 兼容 | API Key | 高速推理 |
| SambaNova | OpenAI 兼容 | API Key | 开源模型优化 |
| HuggingFace | OpenAI 兼容 | API Key | 社区模型 |
| SiliconFlow | OpenAI 兼容 | API Key | 国内免费模型 |
| 智谱 AI | OpenAI 兼容 | API Key | GLM 系列 |
| 通义千问 | OpenAI 兼容 | API Key | Qwen 系列 |
| Mistral | OpenAI 兼容 | API Key | 欧洲提供商 |

### 3.3 路由引擎

#### 3.3.1 路由策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| `priority` | 按优先级顺序选择 | 默认策略，用户自定义顺序 |
| `balanced` | 均衡分配请求 | 均衡使用各提供商额度 |
| `fastest` | 选择延迟最低的提供商 | 需要快速响应 |
| `smartest` | 选择评分最高的模型 | 需要高质量输出 |
| `cheapest` | 选择最便宜的提供商 | 成本敏感场景 |
| `random` | 随机选择 | 测试和实验 |
| `round-robin` | 轮询选择 | 均匀分配 |

#### 3.3.2 模型评分

路由器根据以下因素为每个模型评分：

```typescript
interface ModelScore {
  modelId: string;
  providerId: string;
  
  // 评分因素 (0-100)
  health: number;        // 健康状态
  speed: number;         // 响应速度
  quality: number;       // 输出质量
  availability: number;  // 可用性（剩余额度）
  reliability: number;   // 可靠性（最近成功率）
  
  // 综合评分
  totalScore: number;
  
  // 元数据
  lastChecked: Date;
  lastUsed: Date;
  errorCount: number;
  successCount: number;
}
```

#### 3.3.3 故障转移机制

```
请求进入
    │
    ▼
┌─────────────────┐
│ 选择最优模型    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 调用提供商 API  │
└────────┬────────┘
         │
    ┌────┴────┐
    │ 成功?   │
    └────┬────┘
    是   │   否
    │    │    │
    ▼    │    ▼
 返回结果 │ ┌─────────────────┐
         │ │ 记录错误        │
         │ │ 标记冷却        │
         │ └────────┬────────┘
         │          │
         │     ┌────┴────┐
         │     │ 还有备选?│
         │     └────┬────┘
         │     是   │   否
         │     │    │    │
         │     ▼    │    ▼
         │ 选择下一个│ 返回错误
         │     │    │
         │     └────┘
         │      循环
         ▼
```

**冷却机制**:
- 429 错误: 冷却 60 秒
- 5xx 错误: 冷却 30 秒
- 超时: 冷却 15 秒
- 密钥无效: 永久禁用直到重新配置

### 3.4 密钥管理

#### 3.4.1 密钥存储

- 使用 AES-256-GCM 加密存储
- 加密密钥由用户配置（环境变量或首次运行生成）
- SQLite 数据库存储加密后的密钥
- 请求时内存解密，不持久化明文

#### 3.4.2 统一 API Key

- 格式: `freellm-<random-32-chars>`
- 用户通过此 Key 访问代理 API
- 代理内部映射到具体提供商密钥
- 支持创建多个统一 Key（不同权限）

#### 3.4.3 密钥管理 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/admin/api/keys` | GET | 列出所有密钥 |
| `/admin/api/keys` | POST | 添加新密钥 |
| `/admin/api/keys/:id` | PUT | 更新密钥 |
| `/admin/api/keys/:id` | DELETE | 删除密钥 |
| `/admin/api/keys/:id/test` | POST | 测试密钥 |

### 3.5 速率限制追踪

#### 3.5.1 追踪维度

| 维度 | 说明 | 存储 |
|------|------|------|
| RPM | 每分钟请求数 | 内存（滑动窗口） |
| RPD | 每天请求数 | SQLite |
| TPM | 每分钟 Token 数 | 内存（滑动窗口） |
| TPD | 每天 Token 数 | SQLite |

#### 3.5.2 追踪粒度

- 按 `(provider, model, key)` 三元组追踪
- 支持提供商报告的限额自动学习
- 超限时自动切换到备用提供商

### 3.6 Admin 管理面板

#### 3.6.1 页面结构

| 页面 | 功能 |
|------|------|
| Dashboard | 总览：提供商状态、今日使用量、错误率 |
| Providers | 提供商管理：添加、配置、测试、启用/禁用 |
| Keys | 密钥管理：添加、编辑、删除、测试密钥 |
| Models | 模型列表：查看所有可用模型、评分、状态 |
| Routes | 路由配置：设置路由策略、优先级、权重 |
| Logs | 请求日志：查看历史请求、筛选、导出 |
| Analytics | 使用分析：Token 使用量、成本节省、趋势图 |
| Settings | 系统设置：加密密钥、代理认证、端口配置 |

#### 3.6.2 实时更新

- 使用 WebSocket 实时更新提供商状态
- 实时显示当前请求路由信息
- 实时更新使用统计

### 3.7 健康检查

#### 3.7.1 检查项目

| 检查项 | 频率 | 说明 |
|--------|------|------|
| 密钥有效性 | 5 分钟 | 测试 API Key 是否有效 |
| 模型可用性 | 10 分钟 | 测试模型是否可调用 |
| 速率限制 | 1 分钟 | 检查是否接近限额 |
| 响应延迟 | 持续 | 记录每次请求的延迟 |

#### 3.7.2 状态定义

| 状态 | 说明 | 行为 |
|------|------|------|
| `healthy` | 正常 | 可接受请求 |
| `degraded` | 降级 | 仍可接受，但可能较慢 |
| `unhealthy` | 不健康 | 拒绝请求 |
| `cooldown` | 冷却中 | 临时拒绝，自动恢复 |

---

## 4. 非功能需求详细说明

### 4.1 性能需求

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| API 代理延迟 | < 50ms | 纯代理层延迟（不含提供商） |
| 首 Token 延迟 | < 500ms (p95) | 从请求到首个响应 Token |
| 并发连接 | > 100 | 同时处理的流式连接 |
| 吞吐量 | > 200 req/s | 单实例处理能力 |
| 内存占用 | < 150MB (空闲) | RSS 内存 |
| 启动时间 | < 3s | 从启动到就绪 |

### 4.2 安全需求

#### 4.2.1 数据安全

| 数据类型 | 加密方式 | 存储位置 |
|----------|----------|----------|
| 提供商 API Key | AES-256-GCM | SQLite |
| 统一 API Key | 明文（可选哈希） | SQLite |
| 请求日志 | 明文 | SQLite |
| 配置信息 | 明文 | .env 文件 |

#### 4.2.2 访问控制

- Admin 面板: 可选密码保护（环境变量配置）
- API 端点: Bearer Token 认证
- 管理 API: 仅本地访问（127.0.0.1）

#### 4.2.3 输入验证

- 所有 API 输入使用 Zod schema 验证
- 拒绝恶意输入（SQL 注入、XSS 等）
- 限制请求体大小（默认 1MB）

### 4.3 可靠性需求

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 可用性 | > 99.5% | 代理服务可用时间 |
| 数据持久化 | SQLite WAL | 支持崩溃恢复 |
| 优雅关闭 | 支持 | SIGTERM 处理 |
| 错误恢复 | 自动 | 故障转移 + 冷却 |

### 4.4 可用性需求

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 安装时间 | < 5 分钟 | 从零到可用 |
| 首次配置 | < 10 分钟 | 添加首个提供商密钥 |
| 文档覆盖 | 100% 核心功能 | 所有核心功能有文档 |
| 语言支持 | 中文 + 英文 | 管理面板和文档 |

### 4.5 可维护性需求

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 代码规范 | ESLint 0 errors | 自动检查 |
| 类型覆盖 | > 90% | TypeScript 类型覆盖 |
| 测试覆盖 | > 70% | 核心逻辑测试覆盖 |
| 模块化 | 清晰边界 | 易于扩展新提供商 |

---

## 5. 部署需求

### 5.1 部署方式

| 方式 | 命令 | 说明 |
|------|------|------|
| npm 全局安装 | `npm install -g freellm` | 推荐方式 |
| Docker | `docker run -d freellm/freellm` | 容器化部署 |
| Docker Compose | `docker compose up -d` | 含可选依赖 |
| 源码运行 | `git clone && pnpm install && pnpm dev` | 开发模式 |

### 5.2 配置方式

| 配置项 | 环境变量 | 默认值 | 说明 |
|--------|----------|--------|------|
| 端口 | `PORT` | 3001 | API 服务器端口 |
| 数据目录 | `DATA_DIR` | `~/.freellm` | 数据存储目录 |
| 加密密钥 | `ENCRYPTION_KEY` | 自动生成 | 密钥加密密钥 |
| 代理认证 | `PROXY_API_KEY` | 无 | 统一 API Key |
| Admin 密码 | `ADMIN_PASSWORD` | 无 | Admin 面板密码 |
| 日志级别 | `LOG_LEVEL` | info | 日志输出级别 |
| CORS | `CORS_ORIGIN` | * | 允许的来源 |

### 5.3 数据目录结构

```
~/.freellm/
├── config.env           # 配置文件
├── freellm.db           # SQLite 数据库
├── freellm.db-wal       # WAL 日志
├── logs/                # 日志目录
│   └── freellm.log
└── backups/             # 备份目录
    └── freellm-*.db
```

---

## 6. 开发计划

### 6.1 Phase 1: MVP (4-6 周)

**目标**: 实现核心功能，可正常使用

| 任务 | 工时 | 依赖 |
|------|------|------|
| 项目初始化（TypeScript + Express + SQLite） | 2 天 | - |
| 核心 API 端点实现 | 3 天 | 项目初始化 |
| 提供商适配器框架 | 2 天 | 项目初始化 |
| 首批 5 个提供商适配器 | 5 天 | 适配器框架 |
| 基础路由器（priority 策略） | 2 天 | 适配器框架 |
| 自动故障转移 | 2 天 | 路由器 |
| 密钥管理（内存存储） | 2 天 | - |
| Admin 管理面板（基础） | 5 天 | API 端点 |
| 基础文档 | 2 天 | - |
| 单元测试 | 3 天 | - |
| **总计** | **28 天** | |

**交付物**:
- 可运行的 freeLLM 服务器
- 5 个提供商适配器
- 基础 Admin 面板
- 基础文档

### 6.2 Phase 2: 完善 (4-6 周)

**目标**: 生产就绪，功能完整

| 任务 | 工时 | 依赖 |
|------|------|------|
| 密钥加密存储 | 3 天 | Phase 1 |
| 速率限制追踪 | 3 天 | Phase 1 |
| 更多路由策略 | 3 天 | Phase 1 |
| 请求日志和使用分析 | 3 天 | Phase 1 |
| Docker 部署 | 2 天 | Phase 1 |
| 更多提供商（10+） | 5 天 | 适配器框架 |
| Admin 面板完善 | 5 天 | Phase 1 |
| 文档完善 | 3 天 | - |
| 集成测试 | 3 天 | - |
| **总计** | **30 天** | |

**交付物**:
- 加密密钥存储
- 完整的速率限制
- 10+ 提供商适配器
- Docker 部署支持
- 完善的文档

### 6.3 Phase 3: 增强 (4-6 周)

**目标**: 高级功能，差异化竞争

| 任务 | 工时 | 依赖 |
|------|------|------|
| 响应缓存 | 2 天 | Phase 2 |
| Token 压缩 | 3 天 | Phase 2 |
| 多协议支持 | 5 天 | Phase 2 |
| 桌面应用 | 5 天 | Phase 2 |
| 插件系统 | 5 天 | Phase 2 |
| 自动更新目录 | 3 天 | Phase 2 |
| 多用户支持 | 3 天 | Phase 2 |
| 性能优化 | 3 天 | Phase 2 |
| **总计** | **29 天** | |

**交付物**:
- 响应缓存和 Token 压缩
- 多协议支持
- 桌面应用
- 插件系统

---

## 7. 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 提供商关闭免费层 | 高 | 中 | 多提供商冗余，快速移除机制 |
| ToS 违规 | 高 | 低 | 遵守条款，仅个人使用，文档声明 |
| 免费额度不足 | 中 | 中 | 动态路由，额度监控，用户提醒 |
| 延迟不稳定 | 中 | 高 | 智能路由，延迟监控，用户可选策略 |
| 安全漏洞 | 高 | 低 | 加密存储，输入验证，安全审计 |
| 维护成本高 | 中 | 中 | 社区驱动，自动化测试，清晰架构 |
| 用户滥用 | 中 | 中 | 限流，使用条款，异常监控 |
| 技术选型风险 | 中 | 低 | 成熟技术栈，参考成功项目 |

---

## 8. 附录

### 8.1 术语表

| 术语 | 说明 |
|------|------|
| Provider | LLM 服务提供商（如 Google、Groq） |
| Adapter | 提供商适配器，封装与提供商的交互 |
| Router | 路由器，根据策略选择最优提供商 |
| Fallback | 故障转移，失败后切换到备用提供商 |
| Cooldown | 冷却期，失败后临时禁止使用 |
| Rate Limit | 速率限制，限制请求频率 |
| Unified Key | 统一密钥，对外暴露的代理密钥 |

### 8.2 参考项目链接

| 项目 | GitHub | 说明 |
|------|--------|------|
| free-claude-code | https://github.com/Alishahryar1/free-claude-code | Python 本地代理 |
| freellmapi | https://github.com/tashfeenahmed/freellmapi | Node.js API 聚合 |
| OmniRoute | https://github.com/diegosouzapw/OmniRoute | TypeScript AI 网关 |
| GPT_API_free | https://github.com/chatanywhere/GPT_API_free | 免费 GPT API |
| FreeToken | https://github.com/AIPMAndy/FreeToken | 免费 Token 资源 |
| free-for-dev | https://github.com/ripienaar/free-for-dev | 免费服务目录 |

### 8.3 首批免费提供商额度参考

| 提供商 | 免费额度 | 限制 |
|--------|----------|------|
| Google Gemini | 200万 Token/天 | 5 RPM (免费层) |
| Groq | 30 RPM, 14400 RPD | Llama 3.1 70B |
| NVIDIA NIM | 40 RPM, 100+ 模型 | 12 个月有效期 |
| OpenRouter | 多个免费模型 | 模型特定限制 |
| DeepSeek | 500万 Token 注册赠送 | 约 ¥1/百万 Token |
| Cerebras | 免费层基础额度 | 高速推理 |
| SiliconFlow | 多个模型免费 | 国内直连 |
| 智谱 AI | 500万 Token 注册赠送 | GLM 系列 |
