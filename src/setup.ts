import 'dotenv/config';
import { getDbInstance } from './db/core.js';
import { runMigrations } from './db/migrate.js';
import { createProvider } from './db/providers.js';
import { createApiKey } from './db/apiKeys.js';
import { encrypt } from './utils/crypto.js';
import { GoogleGeminiAdapter, GroqAdapter, NvidiaNIMAdapter, OpenRouterAdapter, DeepSeekAdapter, CerebrasAdapter, SambaNovaAdapter, HuggingFaceAdapter } from './providers/index.js';

async function setup(): Promise<void> {
  // Initialize database
  getDbInstance();
  runMigrations();

  // Create providers
  const providers = [
    new GoogleGeminiAdapter(),
    new GroqAdapter(),
    new NvidiaNIMAdapter(),
    new OpenRouterAdapter(),
    new DeepSeekAdapter(),
    new CerebrasAdapter(),
    new SambaNovaAdapter(),
    new HuggingFaceAdapter(),
  ];

  for (const adapter of providers) {
    try {
      createProvider({
        id: adapter.id,
        name: adapter.name,
        type: 'openai-compatible',
        baseUrl: adapter.baseUrl,
        authType: 'api-key',
        models: (adapter as any)._models || [],
        rateLimits: { rpm: 60, rpd: 1000, tpm: 100000, tpd: 1000000 },
        features: { streaming: true, tools: false, vision: false, reasoning: false },
        enabled: true,
      });
      console.log(`Created provider: ${adapter.name}`);
    } catch (error) {
      console.log(`Provider ${adapter.name} already exists or error: ${error}`);
    }
  }

  // Add example API keys (users should replace these with their actual keys)
  const exampleKeys = [
    { providerId: 'groq', name: 'Groq API Key', key: process.env.GROQ_API_KEY || 'gsk_example_key' },
    { providerId: 'google', name: 'Google API Key', key: process.env.GOOGLE_API_KEY || 'AIzaSy_example_key' },
    { providerId: 'nvidia', name: 'NVIDIA API Key', key: process.env.NVIDIA_API_KEY || 'nvapi-example_key' },
  ];

  for (const { providerId, name, key } of exampleKeys) {
    try {
      const encryptedKey = encrypt(key);
      createApiKey(providerId, name, encryptedKey);
      console.log(`Created API key for ${providerId}`);
    } catch (error) {
      console.log(`Error creating API key for ${providerId}: ${error}`);
    }
  }

  console.log('\nSetup complete!');
  console.log('To add your own API keys, use the admin API or edit the .env file.');
}

setup().catch(console.error);
