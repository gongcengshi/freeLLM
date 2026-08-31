import { providerRegistry } from '../providers/registry.js';
import { getActiveApiKeysByProvider, updateApiKey } from '../db/apiKeys.js';
import { decrypt } from '../utils/crypto.js';

export interface ValidationResult {
  providerId: string;
  apiKeyId: string;
  valid: boolean;
  error?: string;
  checkedAt: string;
}

export class KeyValidator {
  /**
   * Validate a single API key
   */
  async validateKey(providerId: string, apiKeyId: string): Promise<ValidationResult> {
    const adapter = providerRegistry.get(providerId);
    if (!adapter) {
      return {
        providerId,
        apiKeyId,
        valid: false,
        error: 'Provider not found',
        checkedAt: new Date().toISOString(),
      };
    }

    const apiKeys = getActiveApiKeysByProvider(providerId);
    const apiKey = apiKeys.find(k => k.id === apiKeyId);
    if (!apiKey) {
      return {
        providerId,
        apiKeyId,
        valid: false,
        error: 'API key not found',
        checkedAt: new Date().toISOString(),
      };
    }

    try {
      const decryptedKey = decrypt(apiKey.key);
      const valid = await adapter.validateKey(decryptedKey);
      
      // Update key status
      updateApiKey(apiKeyId, { status: valid ? 'active' : 'invalid' });

      return {
        providerId,
        apiKeyId,
        valid,
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        providerId,
        apiKeyId,
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        checkedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Validate all API keys for a provider
   */
  async validateAllKeysForProvider(providerId: string): Promise<ValidationResult[]> {
    const apiKeys = getActiveApiKeysByProvider(providerId);
    const results: ValidationResult[] = [];

    for (const apiKey of apiKeys) {
      const result = await this.validateKey(providerId, apiKey.id);
      results.push(result);
    }

    return results;
  }

  /**
   * Validate all API keys across all providers
   */
  async validateAllKeys(): Promise<ValidationResult[]> {
    const providers = providerRegistry.getAll();
    const results: ValidationResult[] = [];

    for (const adapter of providers) {
      const providerResults = await this.validateAllKeysForProvider(adapter.id);
      results.push(...providerResults);
    }

    return results;
  }
}

export const keyValidator = new KeyValidator();
