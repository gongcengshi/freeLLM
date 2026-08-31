# freeLLM

**免费大语言模型 API 聚合网关**

将多个免费 LLM 提供商的额度聚合为统一的 OpenAI 兼容 API 端点。

## 特性

- **统一 API**: 兼容 OpenAI SDK，一个端点访问所有免费模型
- **智能路由**: 多种路由策略（优先级、均衡、最快、最智能、随机、轮询）
- **自动故障转移**: 请求失败自动切换到备用提供商（最多3次）
- **密钥加密**: AES-256-GCM 加密存储提供商密钥
- **使用追踪**: 追踪每个密钥的使用量，避免超限
- **健康检查**: 定时检查提供商状态，自动冷却故障密钥
- **请求缓存**: 缓存相同请求，提高响应速度
- **管理面板**: React + TailwindCSS 构建的 Web UI

## 支持的提供商

| 提供商 | 免费额度 | 状态 |
|--------|----------|------|
| Google Gemini | 200万 Token/天 | ✅ 已实现 |
| Groq | 30 RPM | ✅ 已实现 |
| NVIDIA NIM | 100+ 模型免费 | ✅ 已实现 |
| OpenRouter | 多个免费模型 | ✅ 已实现 |
| DeepSeek | 500万 Token | ✅ 已实现 |
| Cerebras | 免费层额度 | ✅ 已实现 |
| SambaNova | 免费层额度 | ✅ 已实现 |
| HuggingFace | 免费推理 API | ✅ 已实现 |

## 快速开始

### 安装

```bash
git clone https://github.com/your-username/freellm.git
cd freellm
npm install
```

### 配置

```bash
cp .env.example .env
# 编辑 .env 文件，添加你的提供商 API 密钥
```

### 启动

```bash
# 启动服务器
npm run dev

# 或使用 CLI
npx tsx src/cli.ts start
```

### 初始化数据库

```bash
npx tsx src/setup.ts
```

### 使用

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3001/v1",
    api_key="freellm-your-unified-key"
)

response = client.chat.completions.create(
    model="groq/llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)
```

## API 端点

### V1 API (兼容 OpenAI)

- `POST /v1/chat/completions` - 聊天补全

### Admin API

- `GET /admin/providers` - 获取提供商列表
- `POST /admin/providers` - 添加提供商
- `PUT /admin/providers/:id` - 更新提供商
- `DELETE /admin/providers/:id` - 删除提供商
- `GET /admin/api-keys` - 获取 API 密钥列表
- `POST /admin/api-keys` - 添加 API 密钥
- `GET /admin/logs` - 获取请求日志
- `GET /admin/logs/stats` - 获取统计信息
- `GET /admin/usage/daily` - 每日使用统计
- `GET /admin/usage/by-model` - 按模型统计
- `GET /admin/scores` - 获取模型评分
- `GET /admin/health` - 健康检查

## 项目结构

```
freeLLM/
├── src/                     # 后端源代码
│   ├── types/               # TypeScript 类型定义
│   ├── db/                  # 数据库操作
│   ├── providers/           # 提供商适配器
│   ├── router/              # 路由引擎
│   ├── services/            # 业务服务
│   ├── server/              # Express 服务器
│   └── utils/               # 工具函数
├── client/                  # 管理面板前端
│   ├── src/
│   │   ├── components/      # React 组件
│   │   ├── pages/           # 页面组件
│   │   └── lib/             # 工具函数
│   └── package.json
├── docs/                    # 文档
├── tests/                   # 测试
├── package.json
└── README.md
```

## 路由策略

| 策略 | 说明 |
|------|------|
| `priority` | 按优先级选择提供商 |
| `balanced` | 综合评分选择 |
| `fastest` | 选择延迟最低的提供商 |
| `smartest` | 选择质量评分最高的提供商 |
| `cheapest` | 选择成本最低的提供商（所有免费） |
| `random` | 随机选择 |
| `round-robin` | 轮询选择 |

## 文档

- [项目分析报告](docs/01-project-analysis.md) - 对 55-FreeDev 开源项目的分析
- [需求清单](docs/02-requirements-checklist.md) - 完整的功能和非功能需求清单
- [需求规格说明书](docs/03-requirements-specification.md) - 详细的需求规格说明

## 开发计划

- **Phase 1 (已完成)**: MVP - 核心 API + 8 个提供商 + 管理面板
- **Phase 2 (进行中)**: 完善 - 更多提供商 + 功能增强
- **Phase 3 (计划中)**: 增强 - 缓存优化 + 多协议 + 桌面应用

## 参考项目

| 项目 | 说明 |
|------|------|
| [free-claude-code](https://github.com/Alishahryar1/free-claude-code) | Python 本地代理，50+ 提供商 |
| [freellmapi](https://github.com/tashfeenahmed/freellmapi) | Node.js API 聚合，34 提供商 |
| [OmniRoute](https://github.com/diegosouzapw/OmniRoute) | TypeScript AI 网关，357 提供商 |
| [GPT_API_free](https://github.com/chatanywhere/GPT_API_free) | 免费 GPT API 中转服务 |

## 许可证

MIT License
