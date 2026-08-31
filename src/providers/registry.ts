import type { ProviderAdapter } from '../providers/base.js';
import { GoogleGeminiAdapter, GroqAdapter, NvidiaNIMAdapter, OpenRouterAdapter, DeepSeekAdapter, CerebrasAdapter, SambaNovaAdapter, HuggingFaceAdapter } from '../providers/index.js';

class ProviderRegistry {
  private adapters: Map<string, ProviderAdapter> = new Map();

  constructor() {
    this.registerBuiltinProviders();
  }

  private registerBuiltinProviders(): void {
    const builtinAdapters: ProviderAdapter[] = [
      new GoogleGeminiAdapter(),
      new GroqAdapter(),
      new NvidiaNIMAdapter(),
      new OpenRouterAdapter(),
      new DeepSeekAdapter(),
      new CerebrasAdapter(),
      new SambaNovaAdapter(),
      new HuggingFaceAdapter(),
    ];

    for (const adapter of builtinAdapters) {
      this.adapters.set(adapter.id, adapter);
    }
  }

  get(id: string): ProviderAdapter | undefined {
    return this.adapters.get(id);
  }

  getAll(): ProviderAdapter[] {
    return Array.from(this.adapters.values());
  }

  getIds(): string[] {
    return Array.from(this.adapters.keys());
  }

  has(id: string): boolean {
    return this.adapters.has(id);
  }
}

export const providerRegistry = new ProviderRegistry();
