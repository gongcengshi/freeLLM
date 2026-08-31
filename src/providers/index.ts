import { OpenAICompatibleAdapter } from './openai-compatible.js';

export class GoogleGeminiAdapter extends OpenAICompatibleAdapter {
  constructor() {
    super('google', 'Google Gemini');
    this.initialize({
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      models: [
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.5-pro',
      ],
    });
  }

  protected override getHeaders(apiKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
  }
}

export class GroqAdapter extends OpenAICompatibleAdapter {
  constructor() {
    super('groq', 'Groq');
    this.initialize({
      baseUrl: 'https://api.groq.com/openai',
      models: [
        'qwen/qwen3.8-27b',
        'qwen/qwen3.6-27b',
        'allam-2-7b',
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
      ],
    });
  }
}

export class NvidiaNIMAdapter extends OpenAICompatibleAdapter {
  constructor() {
    super('nvidia', 'NVIDIA NIM');
    this.initialize({
      baseUrl: 'https://integrate.api.nvidia.com/v1',
      models: [
        'nvidia/nemotron-3-super-120b-a12b',
        'meta/llama-3.3-70b-instruct',
        'deepseek-ai/deepseek-r1',
        'qwen/qwen3-32b',
      ],
    });
  }
}

export class OpenRouterAdapter extends OpenAICompatibleAdapter {
  constructor() {
    super('openrouter', 'OpenRouter');
    this.initialize({
      baseUrl: 'https://openrouter.ai/api/v1',
      models: [
        'meta-llama/llama-3.3-70b-instruct:free',
        'google/gemini-2.0-flash-exp:free',
        'mistralai/mistral-7b-instruct:free',
        'qwen/qwen-2.5-72b-instruct:free',
      ],
    });
  }

  protected override transformRequest(request: any): any {
    return {
      ...super.transformRequest(request),
      models: request.models,
    };
  }
}

export class DeepSeekAdapter extends OpenAICompatibleAdapter {
  constructor() {
    super('deepseek', 'DeepSeek');
    this.initialize({
      baseUrl: 'https://api.deepseek.com/v1',
      models: [
        'deepseek-v4-pro',
        'deepseek-v4-flash',
        'deepseek-v4-flash-vision-exp',
      ],
    });
  }
}

export class CerebrasAdapter extends OpenAICompatibleAdapter {
  constructor() {
    super('cerebras', 'Cerebras');
    this.initialize({
      baseUrl: 'https://api.cerebras.ai/v1',
      models: [
        'llama-3.3-70b',
        'llama-3.1-8b',
        'qwen-2.5-32b',
      ],
    });
  }
}

export class SambaNovaAdapter extends OpenAICompatibleAdapter {
  constructor() {
    super('sambanova', 'SambaNova');
    this.initialize({
      baseUrl: 'https://api.sambanova.ai/v1',
      models: [
        'Meta-Llama-3.3-70B-Instruct',
        'DeepSeek-V3-0324',
        'QwQ-32B',
      ],
    });
  }
}

export class HuggingFaceAdapter extends OpenAICompatibleAdapter {
  constructor() {
    super('huggingface', 'HuggingFace');
    this.initialize({
      baseUrl: 'https://api-inference.huggingface.co/v1',
      models: [
        'meta-llama/Llama-3.3-70B-Instruct',
        'Qwen/Qwen2.5-72B-Instruct',
        'mistralai/Mistral-7B-Instruct-v0.3',
      ],
    });
  }

  protected override getHeaders(apiKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
  }
}
