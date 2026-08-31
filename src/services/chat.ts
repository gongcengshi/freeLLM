import { providerRegistry } from '../providers/registry.js';
import { getAllProviders } from '../db/providers.js';
import { getActiveApiKeysByProvider, setApiKeyCooldown, markApiKeyUsed, markApiKeyInvalid } from '../db/apiKeys.js';
import { decrypt } from '../utils/crypto.js';
import { routerEngine, type RouterCandidate } from '../router/engine.js';
import { createRequestLog } from '../db/logs.js';
import { updateModelScoreSuccess, updateModelScoreError } from '../db/modelScores.js';
import { chatCompletionCache } from '../utils/cache.js';
import { broadcastWsMessage } from '../server/app.js';
import type { ChatRequest, ChatResponse, ChatChunk, RoutingStrategy } from '../types/index.js';

const MAX_FALLBACK_ATTEMPTS = 3;
const COOLDOWN_SECONDS = 60;

export class ChatService {
  private defaultStrategy: RoutingStrategy = 'priority';

  setDefaultStrategy(strategy: RoutingStrategy): void {
    this.defaultStrategy = strategy;
  }

  async chatCompletion(
    request: ChatRequest,
    strategy?: RoutingStrategy
  ): Promise<ChatResponse> {
    const selectedStrategy = strategy || this.defaultStrategy;

    // Check cache for non-streaming requests
    const cacheKey = !request.stream
      ? `${request.model}:${JSON.stringify(request.messages)}`
      : null;
    
    if (cacheKey) {
      const cached = chatCompletionCache.get(cacheKey);
      if (cached) {
        return cached as ChatResponse;
      }
    }

    const candidates = this.getCandidates(request.model);
    
    if (candidates.length === 0) {
      throw new Error(`No available providers for model: ${request.model}`);
    }

    let lastError: Error | null = null;
    const attemptedProviders = new Set<string>();

    for (let attempt = 0; attempt < Math.min(MAX_FALLBACK_ATTEMPTS, candidates.length); attempt++) {
      const candidate = routerEngine.selectCandidate(candidates, selectedStrategy, request.model);
      if (!candidate) break;

      // Avoid retrying the same provider
      if (attemptedProviders.has(candidate.providerId)) {
        const remaining = candidates.filter(c => !attemptedProviders.has(c.providerId));
        if (remaining.length === 0) break;
        const nextCandidate = routerEngine.selectCandidate(remaining, selectedStrategy, request.model);
        if (!nextCandidate) break;
        Object.assign(candidate, nextCandidate);
      }

      attemptedProviders.add(candidate.providerId);

      const adapter = providerRegistry.get(candidate.providerId);
      if (!adapter) continue;

      try {
        const startTime = Date.now();
        const response = await adapter.chatCompletion(request, candidate.apiKey);
        const latencyMs = Date.now() - startTime;

        // Log success
        createRequestLog({
          timestamp: new Date().toISOString(),
          model: request.model,
          providerId: candidate.providerId,
          apiKeyId: candidate.apiKeyId,
          status: 'success',
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
          latencyMs,
        });

        // Update scores
        updateModelScoreSuccess(request.model, candidate.providerId, latencyMs);
        markApiKeyUsed(candidate.apiKeyId);

        // Add metadata
        response['x-freellm-provider'] = candidate.providerId;
        response['x-freellm-model'] = candidate.modelId;
        response['x-freellm-latency-ms'] = latencyMs;

        // Cache the response
        if (cacheKey && !request.stream) {
          chatCompletionCache.set(cacheKey, response);
        }

        // Broadcast to WebSocket clients
        broadcastWsMessage({
          type: 'request_complete',
          data: {
            model: request.model,
            providerId: candidate.providerId,
            latencyMs,
            tokens: response.usage.total_tokens,
            status: 'success',
            timestamp: new Date().toISOString(),
          },
        });

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Log failure
        createRequestLog({
          timestamp: new Date().toISOString(),
          model: request.model,
          providerId: candidate.providerId,
          apiKeyId: candidate.apiKeyId,
          status: 'error',
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          latencyMs: 0,
          error: lastError.message,
        });

        // Update error scores
        updateModelScoreError(request.model, candidate.providerId);

        // Handle rate limiting
        if (lastError.message.includes('429') || lastError.message.includes('rate limit')) {
          setApiKeyCooldown(candidate.apiKeyId, COOLDOWN_SECONDS);
        }

        // Handle invalid key
        if (lastError.message.includes('401') || lastError.message.includes('403')) {
          markApiKeyInvalid(candidate.apiKeyId);
        }

        // Broadcast error to WebSocket clients
        broadcastWsMessage({
          type: 'request_error',
          data: {
            model: request.model,
            providerId: candidate.providerId,
            error: lastError.message,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    throw lastError || new Error('All providers failed');
  }

  async *streamChatCompletion(
    request: ChatRequest,
    strategy?: RoutingStrategy
  ): AsyncGenerator<ChatChunk> {
    const selectedStrategy = strategy || this.defaultStrategy;
    const candidates = this.getCandidates(request.model);
    
    if (candidates.length === 0) {
      throw new Error(`No available providers for model: ${request.model}`);
    }

    let lastError: Error | null = null;
    const attemptedProviders = new Set<string>();

    for (let attempt = 0; attempt < Math.min(MAX_FALLBACK_ATTEMPTS, candidates.length); attempt++) {
      const candidate = routerEngine.selectCandidate(candidates, selectedStrategy, request.model);
      if (!candidate) break;

      if (attemptedProviders.has(candidate.providerId)) {
        const remaining = candidates.filter(c => !attemptedProviders.has(c.providerId));
        if (remaining.length === 0) break;
        const nextCandidate = routerEngine.selectCandidate(remaining, selectedStrategy, request.model);
        if (!nextCandidate) break;
        Object.assign(candidate, nextCandidate);
      }

      attemptedProviders.add(candidate.providerId);

      const adapter = providerRegistry.get(candidate.providerId);
      if (!adapter) continue;

      try {
        const startTime = Date.now();
        let totalTokens = 0;

        yield* adapter.streamChatCompletion(request, candidate.apiKey);

        const latencyMs = Date.now() - startTime;

        // Log success
        createRequestLog({
          timestamp: new Date().toISOString(),
          model: request.model,
          providerId: candidate.providerId,
          apiKeyId: candidate.apiKeyId,
          status: 'success',
          promptTokens: 0,
          completionTokens: totalTokens,
          totalTokens,
          latencyMs,
        });

        updateModelScoreSuccess(request.model, candidate.providerId, latencyMs);
        markApiKeyUsed(candidate.apiKeyId);

        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        createRequestLog({
          timestamp: new Date().toISOString(),
          model: request.model,
          providerId: candidate.providerId,
          apiKeyId: candidate.apiKeyId,
          status: 'error',
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          latencyMs: 0,
          error: lastError.message,
        });

        updateModelScoreError(request.model, candidate.providerId);

        if (lastError.message.includes('429') || lastError.message.includes('rate limit')) {
          setApiKeyCooldown(candidate.apiKeyId, COOLDOWN_SECONDS);
        }

        if (lastError.message.includes('401') || lastError.message.includes('403')) {
          markApiKeyInvalid(candidate.apiKeyId);
        }
      }
    }

    throw lastError || new Error('All providers failed');
  }

  private getCandidates(requestedModel: string): RouterCandidate[] {
    const providers = getAllProviders();
    const candidates: RouterCandidate[] = [];

    for (const provider of providers) {
      const adapter = providerRegistry.get(provider.id);
      if (!adapter) continue;

      // Check if requested model is available
      const hasModel = provider.models.some(m => 
        m === requestedModel || 
        `${provider.id}/${m}` === requestedModel ||
        m.includes(requestedModel)
      );
      if (!hasModel && requestedModel !== '*') continue;

      const apiKeys = getActiveApiKeysByProvider(provider.id);
      for (const apiKey of apiKeys) {
        const decryptedKey = decrypt(apiKey.key);
        candidates.push({
          providerId: provider.id,
          modelId: requestedModel === '*' ? provider.models[0] : requestedModel,
          apiKeyId: apiKey.id,
          apiKey: decryptedKey,
        });
      }
    }

    return candidates;
  }
}

export const chatService = new ChatService();
