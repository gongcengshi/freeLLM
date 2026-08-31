import { providerRegistry } from '../providers/registry.js';
import { getAllProviders } from '../db/providers.js';
import { getActiveApiKeysByProvider } from '../db/apiKeys.js';
import { upsertModelScore } from '../db/modelScores.js';
import { decrypt } from '../utils/crypto.js';
import type { HealthStatus } from '../types/index.js';

export interface HealthCheckResult {
  providerId: string;
  status: HealthStatus;
  latencyMs?: number;
  error?: string;
  checkedAt: string;
}

export class HealthChecker {
  private intervalMs: number = 5 * 60 * 1000; // 5 minutes
  private timer: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;

  start(intervalMs?: number): void {
    if (this.timer) return;
    
    this.intervalMs = intervalMs || this.intervalMs;
    this.timer = setInterval(() => this.runChecks(), this.intervalMs);
    
    // Run initial check
    this.runChecks();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runChecks(): Promise<HealthCheckResult[]> {
    if (this.isRunning) return [];
    this.isRunning = true;

    const results: HealthCheckResult[] = [];

    try {
      const providers = getAllProviders();
      
      for (const provider of providers) {
        const adapter = providerRegistry.get(provider.id);
        if (!adapter) continue;

        const apiKeys = getActiveApiKeysByProvider(provider.id);
        if (apiKeys.length === 0) continue;

        // Use first available API key for health check
        const apiKey = apiKeys[0];
        const decryptedKey = decrypt(apiKey.key);

        try {
          const result = await adapter.healthCheck(decryptedKey);
          
          results.push({
            providerId: provider.id,
            status: result.status,
            latencyMs: result.latencyMs,
            error: result.error,
            checkedAt: new Date().toISOString(),
          });

          // Update model scores
          for (const modelId of provider.models) {
            upsertModelScore({
              modelId: `${provider.id}/${modelId}`,
              providerId: provider.id,
              health: result.status === 'healthy' ? 100 : result.status === 'degraded' ? 50 : 0,
              speed: result.latencyMs ? Math.max(0, 100 - (result.latencyMs / 100)) : 50,
              quality: 50,
              availability: result.status === 'healthy' ? 100 : result.status === 'degraded' ? 50 : 0,
              reliability: 50,
              totalScore: 50,
              lastChecked: new Date().toISOString(),
              errorCount: result.status === 'unhealthy' ? 1 : 0,
              successCount: result.status === 'healthy' ? 1 : 0,
            });
          }
        } catch (error) {
          results.push({
            providerId: provider.id,
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            checkedAt: new Date().toISOString(),
          });
        }
      }
    } finally {
      this.isRunning = false;
    }

    return results;
  }

  async checkSingleProvider(providerId: string): Promise<HealthCheckResult | null> {
    const adapter = providerRegistry.get(providerId);
    if (!adapter) return null;

    const apiKeys = getActiveApiKeysByProvider(providerId);
    if (apiKeys.length === 0) return null;

    const apiKey = apiKeys[0];
    const decryptedKey = decrypt(apiKey.key);

    try {
      const result = await adapter.healthCheck(decryptedKey);
      return {
        providerId,
        status: result.status,
        latencyMs: result.latencyMs,
        error: result.error,
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        providerId,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        checkedAt: new Date().toISOString(),
      };
    }
  }
}

export const healthChecker = new HealthChecker();
