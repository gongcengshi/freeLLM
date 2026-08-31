import type { ChatRequest, ChatResponse, ChatChunk, Model, HealthStatus } from '../types/index.js';

export interface ProviderAdapter {
  readonly id: string;
  readonly name: string;
  readonly baseUrl: string;

  /**
   * Initialize the provider adapter with configuration
   */
  initialize(config: { baseUrl: string; models: string[] }): void;

  /**
   * Send a chat completion request
   */
  chatCompletion(request: ChatRequest, apiKey: string): Promise<ChatResponse>;

  /**
   * Stream a chat completion request
   */
  streamChatCompletion(request: ChatRequest, apiKey: string): AsyncGenerator<ChatChunk>;

  /**
   * List available models from the provider
   */
  listModels(apiKey: string): Promise<Model[]>;

  /**
   * Validate an API key
   */
  validateKey(apiKey: string): Promise<boolean>;

  /**
   * Check provider health
   */
  healthCheck(apiKey: string): Promise<{ status: HealthStatus; latencyMs?: number; error?: string }>;
}

export abstract class BaseProviderAdapter implements ProviderAdapter {
  readonly id: string;
  readonly name: string;
  protected _baseUrl: string;
  protected _models: string[] = [];

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this._baseUrl = '';
  }

  get baseUrl(): string {
    return this._baseUrl;
  }

  initialize(config: { baseUrl: string; models: string[] }): void {
    this._baseUrl = config.baseUrl;
    this._models = config.models;
  }

  abstract chatCompletion(request: ChatRequest, apiKey: string): Promise<ChatResponse>;
  abstract streamChatCompletion(request: ChatRequest, apiKey: string): AsyncGenerator<ChatChunk>;
  abstract listModels(apiKey: string): Promise<Model[]>;
  abstract validateKey(apiKey: string): Promise<boolean>;
  abstract healthCheck(apiKey: string): Promise<{ status: HealthStatus; latencyMs?: number; error?: string }>;

  protected generateId(): string {
    return `chatcmpl-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }

  protected formatModelId(model: string): string {
    return `${this.id}/${model}`;
  }
}
