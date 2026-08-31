import { getDbInstance } from './core.js';
import { v4 as uuidv4 } from 'uuid';
import type { RequestLog } from '../types/index.js';

export function createRequestLog(log: Omit<RequestLog, 'id'>): RequestLog {
  const db = getDbInstance();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO request_logs (id, timestamp, model, provider_id, api_key_id, status, prompt_tokens, completion_tokens, total_tokens, latency_ms, error)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    log.timestamp,
    log.model,
    log.providerId,
    log.apiKeyId,
    log.status,
    log.promptTokens,
    log.completionTokens,
    log.totalTokens,
    log.latencyMs,
    log.error
  );
  return { ...log, id };
}

export function getRequestLogs(options: {
  limit?: number;
  offset?: number;
  providerId?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
} = {}): RequestLog[] {
  const db = getDbInstance();
  const conditions: string[] = [];
  const params: any[] = [];

  if (options.providerId) {
    conditions.push('provider_id = ?');
    params.push(options.providerId);
  }
  if (options.startTime) {
    conditions.push('timestamp >= ?');
    params.push(options.startTime);
  }
  if (options.endTime) {
    conditions.push('timestamp <= ?');
    params.push(options.endTime);
  }
  if (options.status) {
    conditions.push('status = ?');
    params.push(options.status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = options.limit || 100;
  const offset = options.offset || 0;

  const rows = db.prepare(`
    SELECT * FROM request_logs ${where}
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as any[];

  return rows.map(row => ({
    id: row.id,
    timestamp: row.timestamp,
    model: row.model,
    providerId: row.provider_id,
    apiKeyId: row.api_key_id,
    status: row.status,
    promptTokens: row.prompt_tokens,
    completionTokens: row.completion_tokens,
    totalTokens: row.total_tokens,
    latencyMs: row.latency_ms,
    error: row.error,
  }));
}

export function getRequestLogStats(options: {
  startTime?: string;
  endTime?: string;
  providerId?: string;
} = {}): {
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  totalTokens: number;
  avgLatencyMs: number;
  byProvider: Record<string, { requests: number; tokens: number }>;
} {
  const db = getDbInstance();
  const conditions: string[] = [];
  const params: any[] = [];

  if (options.startTime) {
    conditions.push('timestamp >= ?');
    params.push(options.startTime);
  }
  if (options.endTime) {
    conditions.push('timestamp <= ?');
    params.push(options.endTime);
  }
  if (options.providerId) {
    conditions.push('provider_id = ?');
    params.push(options.providerId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_requests,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_requests,
      SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_requests,
      SUM(total_tokens) as total_tokens,
      AVG(latency_ms) as avg_latency_ms
    FROM request_logs ${where}
  `).get(...params) as any;

  const byProviderRows = db.prepare(`
    SELECT
      provider_id,
      COUNT(*) as requests,
      SUM(total_tokens) as tokens
    FROM request_logs ${where}
    GROUP BY provider_id
  `).all(...params) as any[];

  const byProvider: Record<string, { requests: number; tokens: number }> = {};
  for (const row of byProviderRows) {
    byProvider[row.provider_id] = {
      requests: row.requests,
      tokens: row.tokens || 0,
    };
  }

  return {
    totalRequests: stats.total_requests || 0,
    successRequests: stats.success_requests || 0,
    errorRequests: stats.error_requests || 0,
    totalTokens: stats.total_tokens || 0,
    avgLatencyMs: stats.avg_latency_ms || 0,
    byProvider,
  };
}

export function cleanupOldLogs(daysToKeep: number = 30): number {
  const db = getDbInstance();
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();
  const result = db.prepare('DELETE FROM request_logs WHERE timestamp < ?').run(cutoffDate);
  return result.changes;
}
