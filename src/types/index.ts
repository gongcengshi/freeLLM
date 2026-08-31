import { z } from 'zod';

// ===== Provider Types =====

export const ProviderTypeSchema = z.enum([
  'openai-compatible',
  'anthropic',
  'gemini',
  'custom',
]);
export type ProviderType = z.infer<typeof ProviderTypeSchema>;

export const ProviderConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ProviderTypeSchema,
  baseUrl: z.string().url(),
  authType: z.enum(['api-key', 'bearer', 'oauth']),
  models: z.array(z.string()),
  rateLimits: z.object({
    rpm: z.number().default(60),
    rpd: z.number().default(1000),
    tpm: z.number().default(100000),
    tpd: z.number().default(1000000),
  }),
  features: z.object({
    streaming: z.boolean().default(true),
    tools: z.boolean().default(false),
    vision: z.boolean().default(false),
    reasoning: z.boolean().default(false),
  }),
  enabled: z.boolean().default(true),
});
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

// ===== Model Types =====

export const ModelSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  name: z.string(),
  maxTokens: z.number().default(4096),
  free: z.boolean().default(true),
  pricing: z.object({
    input: z.number().default(0),
    output: z.number().default(0),
  }).optional(),
  features: z.object({
    streaming: z.boolean().default(true),
    tools: z.boolean().default(false),
    vision: z.boolean().default(false),
    reasoning: z.boolean().default(false),
  }),
});
export type Model = z.infer<typeof ModelSchema>;

// ===== API Key Types =====

export const ApiKeyStatusSchema = z.enum(['active', 'inactive', 'rate_limited', 'invalid', 'cooldown']);
export type ApiKeyStatus = z.infer<typeof ApiKeyStatusSchema>;

export const ApiKeySchema = z.object({
  id: z.string().uuid(),
  providerId: z.string(),
  name: z.string(),
  key: z.string(), // encrypted
  status: ApiKeyStatusSchema.default('active'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastUsedAt: z.string().datetime().optional(),
  lastCheckedAt: z.string().datetime().optional(),
  cooldownUntil: z.string().datetime().optional(),
  usage: z.object({
    rpm: z.number().default(0),
    rpd: z.number().default(0),
    tpm: z.number().default(0),
    tpd: z.number().default(0),
  }),
});
export type ApiKey = z.infer<typeof ApiKeySchema>;

// ===== Chat Types =====

export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.union([z.string(), z.null()]).optional(),
  name: z.string().optional(),
  tool_call_id: z.string().optional(),
  tool_calls: z.array(z.object({
    id: z.string(),
    type: z.literal('function'),
    function: z.object({
      name: z.string(),
      arguments: z.string(),
    }),
  })).optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatRequestSchema = z.object({
  model: z.string(),
  messages: z.array(ChatMessageSchema),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  max_tokens: z.number().min(1).optional(),
  stream: z.boolean().optional().default(false),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  user: z.string().optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  id: z.string(),
  object: z.literal('chat.completion'),
  created: z.number(),
  model: z.string(),
  choices: z.array(z.object({
    index: z.number(),
    message: z.object({
      role: z.literal('assistant'),
      content: z.string().nullable(),
    }),
    finish_reason: z.enum(['stop', 'length', 'tool_calls', 'content_filter']).nullable(),
  })),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }),
  // FreeLLM metadata
  'x-freellm-provider': z.string().optional(),
  'x-freellm-model': z.string().optional(),
  'x-freellm-latency-ms': z.number().optional(),
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export const ChatChunkSchema = z.object({
  id: z.string(),
  object: z.literal('chat.completion.chunk'),
  created: z.number(),
  model: z.string(),
  choices: z.array(z.object({
    index: z.number(),
    delta: z.object({
      role: z.literal('assistant').optional(),
      content: z.string().nullable().optional(),
    }),
    finish_reason: z.enum(['stop', 'length', 'tool_calls', 'content_filter']).nullable(),
  })),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }).optional(),
});
export type ChatChunk = z.infer<typeof ChatChunkSchema>;

// ===== Router Types =====

export const RoutingStrategySchema = z.enum([
  'priority',
  'balanced',
  'fastest',
  'smartest',
  'cheapest',
  'random',
  'round-robin',
]);
export type RoutingStrategy = z.infer<typeof RoutingStrategySchema>;

export const ModelScoreSchema = z.object({
  modelId: z.string(),
  providerId: z.string(),
  health: z.number().min(0).max(100),
  speed: z.number().min(0).max(100),
  quality: z.number().min(0).max(100),
  availability: z.number().min(0).max(100),
  reliability: z.number().min(0).max(100),
  totalScore: z.number().min(0).max(100),
  lastChecked: z.string().datetime(),
  lastUsed: z.string().datetime().optional(),
  errorCount: z.number().default(0),
  successCount: z.number().default(0),
});
export type ModelScore = z.infer<typeof ModelScoreSchema>;

// ===== Health Types =====

export const HealthStatusSchema = z.enum(['healthy', 'degraded', 'unhealthy', 'cooldown']);
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export const ProviderHealthSchema = z.object({
  providerId: z.string(),
  status: HealthStatusSchema,
  lastChecked: z.string().datetime(),
  latencyMs: z.number().optional(),
  error: z.string().optional(),
});
export type ProviderHealth = z.infer<typeof ProviderHealthSchema>;

// ===== Request Log Types =====

export const RequestLogSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  model: z.string(),
  providerId: z.string(),
  apiKeyId: z.string().uuid(),
  status: z.enum(['success', 'error', 'timeout']),
  promptTokens: z.number(),
  completionTokens: z.number(),
  totalTokens: z.number(),
  latencyMs: z.number(),
  error: z.string().optional(),
});
export type RequestLog = z.infer<typeof RequestLogSchema>;

// ===== Settings Types =====

export const SettingsSchema = z.object({
  port: z.number().default(3001),
  host: z.string().default('0.0.0.0'),
  dataDir: z.string().default('~/.freellm'),
  encryptionKey: z.string().optional(),
  proxyApiKey: z.string().optional(),
  adminPassword: z.string().optional(),
  corsOrigin: z.string().default('*'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  rateLimitWindowMs: z.number().default(60000),
  rateLimitMaxRequests: z.number().default(100),
});
export type Settings = z.infer<typeof SettingsSchema>;
