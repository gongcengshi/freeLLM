# freeLLM 需求清单

> 版本: 1.0  
> 日期: 2026-08-30  
> 状态: 待确认

---

## 一、项目概述

| 项目 | 说明 |
|------|------|
| 项目名称 | freeLLM |
| 项目定位 | 免费大语言模型 API 聚合网关 |
| 核心目标 | 将多个免费 LLM 提供商的额度聚合为统一的 OpenAI 兼容 API 端点 |
| 目标用户 | 个人开发者、学习者、小型团队 |
| 技术栈（暂定） | TypeScript / Node.js + React（参考 freellmapi / OmniRoute） |

---

## 二、功能需求清单

### P0 - 核心功能（必须实现）

| 编号 | 功能 | 说明 | 参考项目 |
|------|------|------|----------|
| F-001 | OpenAI 兼容 API | 提供 `/v1/chat/completions` 端点，兼容 OpenAI SDK | freellmapi, OmniRoute |
| F-002 | 流式响应 | 支持 SSE 流式输出（stream: true） | 全部 |
| F-003 | 提供商适配器 | 每个提供商独立适配器，实现统一接口 | freellmapi, OmniRoute |
| F-004 | 智能路由器 | 根据策略选择最优提供商处理请求 | freellmapi, OmniRoute |
| F-005 | 自动故障转移 | 请求失败后自动尝试下一个提供商 | 全部 |
| F-006 | 密钥管理 | 添加/删除/编辑提供商 API 密钥 | freellmapi, OmniRoute |
| F-007 | 统一 API Key | 对外暴露统一密钥，隐藏提供商原始密钥 | freellmapi, OmniRoute |
| F-008 | 模型列表 | `/v1/models` 返回所有可用模型 | freellmapi, OmniRoute |
| F-009 | Admin 管理面板 | Web UI 管理提供商、密钥、模型配置 | free-claude-code, freellmapi |
| F-010 | 健康检查 | `/health` 端点 + 定期探测提供商状态 | freellmapi, OmniRoute |

### P1 - 重要功能（应该实现）

| 编号 | 功能 | 说明 | 参考项目 |
|------|------|------|----------|
| F-101 | 密钥加密存储 | AES-256-GCM 加密存储提供商密钥 | freellmapi, OmniRoute |
| F-102 | 速率限制追踪 | 追踪每个密钥的 RPM/RPD/TPM/TPD | freellmapi, OmniRoute |
| F-103 | 路由策略 | 支持多种路由策略（priority, balanced, fastest 等） | freellmapi, OmniRoute |
| F-104 | 请求日志 | 记录每个请求的提供商、延迟、Token 使用量 | freellmapi, OmniRoute |
| F-105 | 使用分析 | 统计 Token 使用量、成本节省、成功率 | freellmapi, OmniRoute |
| F-106 | 提供商目录 | 维护免费模型/提供商数据库 | freellmapi, OmniRoute |
| F-107 | Docker 部署 | 提供 Dockerfile 和 docker-compose | freellmapi, OmniRoute |
| F-108 | CLI 工具 | 命令行管理工具（添加密钥、查看状态等） | free-claude-code |
| F-109 | 响应缓存 | 相同请求缓存结果，减少 API 调用 | freellmapi, OmniRoute |
| F-110 | 配置导入导出 | 支持 .env / JSON 格式导入导出配置 | freellmapi |

### P2 - 增强功能（可以实现）

| 编号 | 功能 | 说明 | 参考项目 |
|------|------|------|----------|
| F-201 | Token 压缩 | 压缩请求/响应减少 Token 消耗 | OmniRoute |
| F-202 | 多协议支持 | Anthropic Messages API、Gemini 原生格式 | OmniRoute |
| F-203 | 桌面应用 | Electron/Tauri 桌面应用 | OmniRoute, free-claude-code |
| F-204 | 消息桥接 | Discord/Telegram 机器人 | free-claude-code |
| F-205 | 语音转录 | 本地 Whisper 或 NVIDIA NIM 语音转录 | free-claude-code |
| F-206 | MCP 服务器 | Model Context Protocol 工具服务器 | OmniRoute |
| F-207 | 插件系统 | 可扩展的插件架构 | OmniRoute |
| F-208 | 多用户支持 | 多用户认证和权限管理 | OmniRoute |
| F-209 | 自动更新目录 | 自动拉取最新免费模型信息 | freellmapi, OmniRoute |
| F-210 | 成本可视化 | 实时显示节省的费用图表 | freellmapi, OmniRoute |

---

## 三、非功能需求清单

### NFR-001 - 性能

| 指标 | 目标 | 说明 |
|------|------|------|
| 首 Token 延迟 | < 500ms（本地） | 代理层增加的延迟 |
| 吞吐量 | > 100 req/s | 单实例处理能力 |
| 内存占用 | < 200MB（空闲） | 资源消耗控制 |
| 并发连接 | > 50 | 同时处理的流式连接数 |

### NFR-002 - 可靠性

| 指标 | 目标 | 说明 |
|------|------|------|
| 可用性 | > 99.5% | 代理服务可用时间 |
| 故障转移 | < 3s | 从失败到切换提供商的时间 |
| 数据持久化 | SQLite WAL | 配置和密钥持久化 |
| 优雅关闭 | 支持 | 等待进行中的请求完成 |

### NFR-003 - 安全性

| 措施 | 要求 | 说明 |
|------|------|------|
| 密钥加密 | AES-256-GCM | 静态加密 |
| 传输安全 | HTTPS（可选） | 支持 TLS |
| 认证 | Bearer Token | 代理层认证 |
| 输入验证 | 全量验证 | 所有 API 输入 |
| 错误脱敏 | 不暴露原始错误 | 生产环境 |
| CORS | 可配置 | 支持跨域请求 |

### NFR-004 - 可用性

| 指标 | 目标 | 说明 |
|------|------|------|
| 安装复杂度 | < 5 分钟 | 从零到可用 |
| 配置复杂度 | 最小化 | 开箱即用 |
| 文档完整度 | 核心功能全覆盖 | 安装、配置、API、故障排除 |
| 多语言 | 中文 + 英文 | 管理面板和文档 |

### NFR-005 - 可维护性

| 指标 | 目标 | 说明 |
|------|------|------|
| 代码规范 | ESLint + Prettier | 自动格式化 |
| 类型安全 | TypeScript strict | 编译时类型检查 |
| 测试覆盖 | > 70% | 核心逻辑测试覆盖 |
| 模块化 | 清晰的模块边界 | 易于扩展新提供商 |

---

## 四、提供商需求清单

### 4.1 首批支持提供商（P0）

| 编号 | 提供商 | 免费额度 | 获取方式 | 优先级 |
|------|--------|----------|----------|--------|
| P-001 | Google Gemini | 200万 Token/天 | Google AI Studio API Key | P0 |
| P-002 | Groq | 30 RPM, 14400 RPD | Groq Console API Key | P0 |
| P-003 | NVIDIA NIM | 100+ 模型免费一年 | build.nvidia.com API Key | P0 |
| P-004 | OpenRouter | 多个免费模型 | OpenRouter API Key | P0 |
| P-005 | DeepSeek | 500万 Token 注册赠送 | DeepSeek Platform API Key | P0 |
| P-006 | Cerebras | 免费层基础额度 | Cerebras Cloud API Key | P0 |
| P-007 | SambaNova | 免费层基础额度 | SambaNova Cloud API Key | P0 |
| P-008 | HuggingFace | 社区免费额度 | HuggingFace API Key | P0 |

### 4.2 第二批支持提供商（P1）

| 编号 | 提供商 | 免费额度 | 获取方式 | 优先级 |
|------|--------|----------|----------|--------|
| P-101 | 硅基流动 (SiliconFlow) | 多个模型免费 | SiliconFlow API Key | P1 |
| P-102 | 智谱 AI (GLM) | 500万 Token 注册赠送 | 智谱开放平台 API Key | P1 |
| P-103 | 通义千问 (Qwen) | 部分模型限时免费 | 阿里云百炼 API Key | P1 |
| P-104 | 月之暗面 (Kimi) | 15 元注册赠送 | Moonshot API Key | P1 |
| P-105 | 讯飞星火 | Lite 版完全免费 | 讯飞开放平台 API Key | P1 |
| P-106 | Cloudflare Workers AI | 10000 次/天 | Cloudflare API Token | P1 |
| P-107 | Together AI | $25 注册赠送 | Together AI API Key | P1 |
| P-108 | Mistral | 免费层基础额度 | Mistral Console API Key | P1 |

### 4.3 第三批支持提供商（P2）

| 编号 | 提供商 | 免费额度 | 获取方式 | 优先级 |
|------|--------|----------|----------|--------|
| P-201 | 百度文心一言 | 部分模型免费 | 百度千帆 API Key | P2 |
| P-202 | 豆包 (字节跳动) | 部分模型限时免费 | 火山引擎 API Key | P2 |
| P-203 | MiniMax | 注册赠送 | MiniMax API Key | P2 |
| P-204 | 阶跃星辰 | 注册赠送 | 阶跃星辰 API Key | P2 |
| P-205 | Cohere | 试用版额度 | Cohere Dashboard API Key | P2 |
| P-206 | Fireworks AI | 免费层额度 | Fireworks AI API Key | P2 |

---

## 五、技术需求清单

### 5.1 技术栈

| 组件 | 技术选择 | 说明 |
|------|----------|------|
| 运行时 | Node.js >= 20 | 参考 freellmapi / OmniRoute |
| 语言 | TypeScript 5.x | 类型安全 |
| Web 框架 | Express / Fastify | API 代理服务器 |
| 数据库 | SQLite (better-sqlite3) | 轻量级本地存储 |
| 前端 | React + Vite + TailwindCSS | Admin 管理面板 |
| UI 组件 | shadcn/ui | 参考 freellmapi |
| 构建工具 | tsup / esbuild | 快速构建 |
| 包管理 | pnpm | Monorepo 支持 |
| 测试 | Vitest | 单元测试和集成测试 |
| 代码规范 | ESLint + Prettier | 自动格式化 |

### 5.2 API 接口

| 端点 | 方法 | 说明 | 优先级 |
|------|------|------|--------|
| `/v1/chat/completions` | POST | 聊天补全（核心） | P0 |
| `/v1/models` | GET | 模型列表 | P0 |
| `/health` | GET | 健康检查 | P0 |
| `/v1/completions` | POST | 文本补全 | P1 |
| `/v1/embeddings` | POST | 文本嵌入 | P1 |
| `/v1/images/generations` | POST | 图像生成 | P2 |
| `/v1/audio/transcriptions` | POST | 语音转录 | P2 |
| `/admin/api/keys` | CRUD | 密钥管理 | P0 |
| `/admin/api/providers` | CRUD | 提供商管理 | P0 |
| `/admin/api/settings` | GET/PUT | 系统设置 | P0 |
| `/admin/api/analytics` | GET | 使用分析 | P1 |
| `/admin/api/logs` | GET | 请求日志 | P1 |

### 5.3 数据模型

| 实体 | 说明 | 关键字段 |
|------|------|----------|
| Provider | 提供商 | id, name, type, baseUrl, models, enabled |
| ApiKey | API 密钥 | id, providerId, key(encrypted), status, usage |
| Model | 模型 | id, providerId, name, maxTokens, free, pricing |
| Route | 路由规则 | id, modelId, strategy, priority, weight |
| RequestLog | 请求日志 | id, timestamp, model, provider, tokens, latency |
| Setting | 系统设置 | key, value, description |

---

## 六、部署需求清单

| 编号 | 需求 | 说明 | 优先级 |
|------|------|------|--------|
| D-001 | npm 全局安装 | `npm install -g freellm` | P0 |
| D-002 | Docker 部署 | `docker run` 一键启动 | P0 |
| D-003 | Docker Compose | 含可选依赖（Redis 缓存等） | P1 |
| D-004 | 源码运行 | `git clone && npm install && npm run dev` | P0 |
| D-005 | 环境变量配置 | `.env` 文件 + 环境变量 | P0 |
| D-006 | 数据目录 | `~/.freellm/` | P0 |
| D-007 | 日志输出 | 控制台 + 文件日志 | P0 |
| D-008 | 自动更新 | 检查新版本提醒 | P2 |
| D-009 | 桌面应用 | Electron/Tauri | P2 |
| D-010 | 一键安装脚本 | curl/wget 安装脚本 | P2 |

---

## 七、文档需求清单

| 编号 | 文档 | 说明 | 优先级 |
|------|------|------|--------|
| DOC-001 | README | 项目介绍、快速开始、功能列表 | P0 |
| DOC-002 | 安装指南 | 详细的安装和配置步骤 | P0 |
| DOC-003 | API 文档 | 所有 API 端点的详细说明 | P0 |
| DOC-004 | 提供商配置指南 | 每个提供商的配置步骤 | P0 |
| DOC-005 | 架构文档 | 系统架构和设计决策 | P1 |
| DOC-006 | 贡献指南 | 如何参与项目开发 | P1 |
| DOC-007 | 变更日志 | 版本更新记录 | P1 |
| DOC-008 | 故障排除 | 常见问题和解决方案 | P1 |
| DOC-009 | 安全指南 | 安全最佳实践 | P2 |
| DOC-010 | 性能调优 | 性能优化建议 | P2 |

---

## 八、里程碑规划

### Phase 1 - MVP（4-6 周）
- [ ] 项目初始化（TypeScript + Express + SQLite）
- [ ] 核心 API 端点（/v1/chat/completions, /v1/models）
- [ ] 3-5 个首批提供商适配器（Gemini, Groq, NVIDIA NIM, OpenRouter, DeepSeek）
- [ ] 基础路由器（priority 策略）
- [ ] 自动故障转移
- [ ] 密钥管理（内存存储）
- [ ] Admin 管理面板（基础 UI）
- [ ] 基础文档

### Phase 2 - 完善（4-6 周）
- [ ] 密钥加密存储
- [ ] 速率限制追踪
- [ ] 更多路由策略（balanced, fastest, smartest）
- [ ] 请求日志和使用分析
- [ ] Docker 部署
- [ ] 更多提供商（10+）
- [ ] 完善文档

### Phase 3 - 增强（4-6 周）
- [ ] 响应缓存
- [ ] Token 压缩
- [ ] 多协议支持（Anthropic, Gemini）
- [ ] 桌面应用
- [ ] 插件系统
- [ ] 多用户支持
- [ ] 自动更新目录

---

## 九、风险清单

| 编号 | 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|------|----------|
| R-001 | 提供商关闭免费层 | 高 | 中 | 多提供商冗余，快速移除 |
| R-002 | ToS 违规风险 | 高 | 低 | 遵守各提供商条款，仅个人使用 |
| R-003 | 免费额度不足 | 中 | 中 | 动态调整路由，优先使用额度充足的提供商 |
| R-004 | 延迟不稳定 | 中 | 高 | 智能路由，选择最快可用提供商 |
| R-005 | 安全漏洞 | 高 | 低 | 加密存储，输入验证，定期审计 |
| R-006 | 维护成本高 | 中 | 中 | 社区驱动，自动化测试 |
| R-007 | 用户滥用 | 中 | 中 | 限流，使用条款，监控 |

---

## 十、验收标准

### 10.1 功能验收
- [ ] 能够通过 OpenAI SDK 成功调用代理 API
- [ ] 能够自动故障转移到备用提供商
- [ ] 能够通过 Admin 面板管理提供商和密钥
- [ ] 能够查看请求日志和使用统计
- [ ] 所有核心 API 端点正常工作

### 10.2 性能验收
- [ ] 本地代理延迟 < 500ms
- [ ] 支持 50+ 并发流式连接
- [ ] 内存占用 < 200MB（空闲）

### 10.3 安全验收
- [ ] 密钥加密存储
- [ ] API 认证正常工作
- [ ] 输入验证覆盖所有端点
- [ ] 错误信息不泄露敏感数据

### 10.4 文档验收
- [ ] README 包含快速开始指南
- [ ] 所有 API 端点有文档
- [ ] 所有支持的提供商有配置指南
- [ ] 常见问题有解答
