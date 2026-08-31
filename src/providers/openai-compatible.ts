import { BaseProviderAdapter } from './base.js';
import type { ChatRequest, ChatResponse, ChatChunk, Model, HealthStatus } from '../types/index.js';
import { proxyFetch } from '../utils/proxy.js';

export class OpenAICompatibleAdapter extends BaseProviderAdapter {
  constructor(id: string, name: string) {
    super(id, name);
  }

  protected getApiPath(): string {
    return 'v1/chat/completions';
  }

  protected getModelsPath(): string {
    return 'v1/models';
  }

  protected getHeaders(apiKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
  }

  protected transformRequest(request: ChatRequest): any {
    // Strip provider prefix from model name (e.g., "deepseek/deepseek-v4-flash" -> "deepseek-v4-flash")
    let modelName = request.model;
    if (modelName.includes('/')) {
      modelName = modelName.split('/').slice(1).join('/');
    }

    const body: any = {
      model: modelName,
      messages: request.messages,
      temperature: request.temperature,
      top_p: request.top_p,
      max_tokens: request.max_tokens,
      stream: request.stream,
      stop: request.stop,
      presence_penalty: request.presence_penalty,
      frequency_penalty: request.frequency_penalty,
      user: request.user,
    };

    // Remove undefined values
    Object.keys(body).forEach(key => {
      if (body[key] === undefined) delete body[key];
    });

    return body;
  }

  protected transformResponse(response: any, request: ChatRequest): ChatResponse {
    return {
      id: response.id || this.generateId(),
      object: 'chat.completion',
      created: response.created || Math.floor(Date.now() / 1000),
      model: response.model || request.model,
      choices: response.choices.map((choice: any) => ({
        index: choice.index,
        message: {
          role: 'assistant' as const,
          content: choice.message?.content || null,
        },
        finish_reason: choice.finish_reason,
      })),
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
      },
      'x-freellm-provider': this.id,
      'x-freellm-model': response.model || request.model,
    };
  }

  protected transformChunk(chunk: any): ChatChunk {
    return {
      id: chunk.id || this.generateId(),
      object: 'chat.completion.chunk',
      created: chunk.created || Math.floor(Date.now() / 1000),
      model: chunk.model || '',
      choices: chunk.choices.map((choice: any) => ({
        index: choice.index,
        delta: {
          role: choice.delta?.role as 'assistant' | undefined,
          content: choice.delta?.content || null,
        },
        finish_reason: choice.finish_reason,
      })),
      usage: chunk.usage ? {
        prompt_tokens: chunk.usage.prompt_tokens || 0,
        completion_tokens: chunk.usage.completion_tokens || 0,
        total_tokens: chunk.usage.total_tokens || 0,
      } : undefined,
    };
  }

  async chatCompletion(request: ChatRequest, apiKey: string): Promise<ChatResponse> {
    const base = this._baseUrl.endsWith('/') ? this._baseUrl : this._baseUrl + '/';
    const url = new URL(this.getApiPath(), base).toString();
    const body = this.transformRequest({ ...request, stream: false });

    const response = await proxyFetch(url, {
      method: 'POST',
      headers: this.getHeaders(apiKey),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Provider ${this.id} error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return this.transformResponse(data, request);
  }

  async *streamChatCompletion(request: ChatRequest, apiKey: string): AsyncGenerator<ChatChunk> {
    const base = this._baseUrl.endsWith('/') ? this._baseUrl : this._baseUrl + '/';
    const url = new URL(this.getApiPath(), base).toString();
    const body = this.transformRequest({ ...request, stream: true });

    const response = await proxyFetch(url, {
      method: 'POST',
      headers: this.getHeaders(apiKey),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Provider ${this.id} error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            yield this.transformChunk(parsed);
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async listModels(apiKey: string): Promise<Model[]> {
    try {
      const base = this._baseUrl.endsWith('/') ? this._baseUrl : this._baseUrl + '/';
      const url = new URL(this.getModelsPath(), base).toString();
      const response = await proxyFetch(url, {
        headers: this.getHeaders(apiKey),
      });

      if (!response.ok) {
        // If model listing not supported, return configured models
        return this._models.map(modelId => ({
          id: this.formatModelId(modelId),
          providerId: this.id,
          name: modelId,
          maxTokens: 4096,
          free: true,
          features: {
            streaming: true,
            tools: false,
            vision: false,
            reasoning: false,
          },
        }));
      }

      const data = await response.json() as any;
      return (data.data || []).map((model: any) => ({
        id: this.formatModelId(model.id),
        providerId: this.id,
        name: model.id,
        maxTokens: model.context_length || 4096,
        free: this._models.includes(model.id),
        features: {
          streaming: true,
          tools: false,
          vision: false,
          reasoning: false,
        },
      }));
    } catch {
      return this._models.map(modelId => ({
        id: this.formatModelId(modelId),
        providerId: this.id,
        name: modelId,
        maxTokens: 4096,
        free: true,
        features: {
          streaming: true,
          tools: false,
          vision: false,
          reasoning: false,
        },
      }));
    }
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      await this.listModels(apiKey);
      return true;
    } catch {
      return false;
    }
  }

  async healthCheck(apiKey: string): Promise<{ status: HealthStatus; latencyMs?: number; error?: string }> {
    const start = Date.now();
    try {
      const models = await this.listModels(apiKey);
      const latencyMs = Date.now() - start;
      return {
        status: models.length > 0 ? 'healthy' : 'degraded',
        latencyMs,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
