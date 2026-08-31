import { getDbInstance } from './core.js';
import { v4 as uuidv4 } from 'uuid';
import type { ApiKey, ApiKeyStatus } from '../types/index.js';

export function getAllApiKeys(): ApiKey[] {
  const db = getDbInstance();
  const rows = db.prepare('SELECT * FROM api_keys ORDER BY created_at DESC').all() as any[];
  return rows.map(row => ({
    id: row.id,
    providerId: row.provider_id,
    name: row.name,
    key: row.key,
    status: row.status as ApiKeyStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastUsedAt: row.last_used_at || undefined,
    lastCheckedAt: row.last_checked_at || undefined,
    cooldownUntil: row.cooldown_until || undefined,
    usage: JSON.parse(row.usage),
  }));
}

export function getApiKeyById(id: string): ApiKey | null {
  const db = getDbInstance();
  const row = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(id) as any;
  if (!row) return null;
  return {
    id: row.id,
    providerId: row.provider_id,
    name: row.name,
    key: row.key,
    status: row.status as ApiKeyStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastUsedAt: row.last_used_at || undefined,
    lastCheckedAt: row.last_checked_at || undefined,
    cooldownUntil: row.cooldown_until || undefined,
    usage: JSON.parse(row.usage),
  };
}

export function getApiKeysByProvider(providerId: string): ApiKey[] {
  const db = getDbInstance();
  const rows = db.prepare('SELECT * FROM api_keys WHERE provider_id = ? ORDER BY created_at DESC').all(providerId) as any[];
  return rows.map(row => ({
    id: row.id,
    providerId: row.provider_id,
    name: row.name,
    key: row.key,
    status: row.status as ApiKeyStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastUsedAt: row.last_used_at || undefined,
    lastCheckedAt: row.last_checked_at || undefined,
    cooldownUntil: row.cooldown_until || undefined,
    usage: JSON.parse(row.usage),
  }));
}

export function getActiveApiKeysByProvider(providerId: string): ApiKey[] {
  const db = getDbInstance();
  const now = new Date().toISOString();
  const rows = db.prepare(`
    SELECT * FROM api_keys 
    WHERE provider_id = ? 
    AND status = 'active'
    AND (cooldown_until IS NULL OR cooldown_until < ?)
    ORDER BY created_at DESC
  `).all(providerId, now) as any[];
  return rows.map(row => ({
    id: row.id,
    providerId: row.provider_id,
    name: row.name,
    key: row.key,
    status: row.status as ApiKeyStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastUsedAt: row.last_used_at || undefined,
    lastCheckedAt: row.last_checked_at || undefined,
    cooldownUntil: row.cooldown_until || undefined,
    usage: JSON.parse(row.usage),
  }));
}

export function createApiKey(providerId: string, name: string, key: string): ApiKey {
  const db = getDbInstance();
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO api_keys (id, provider_id, name, key, status, created_at, updated_at, usage)
    VALUES (?, ?, ?, ?, 'active', ?, ?, '{}')
  `).run(id, providerId, name, key, now, now);
  return getApiKeyById(id)!;
}

export function updateApiKey(id: string, updates: Partial<{ name: string; key: string; status: ApiKeyStatus }>): void {
  const db = getDbInstance();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.key !== undefined) { fields.push('key = ?'); values.push(updates.key); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }

  if (fields.length === 0) return;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE api_keys SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteApiKey(id: string): void {
  const db = getDbInstance();
  db.prepare('DELETE FROM api_keys WHERE id = ?').run(id);
}

export function setApiKeyCooldown(id: string, cooldownSeconds: number): void {
  const db = getDbInstance();
  const cooldownUntil = new Date(Date.now() + cooldownSeconds * 1000).toISOString();
  db.prepare(`
    UPDATE api_keys SET cooldown_until = ?, status = 'cooldown', updated_at = datetime('now')
    WHERE id = ?
  `).run(cooldownUntil, id);
}

export function markApiKeyUsed(id: string): void {
  const db = getDbInstance();
  db.prepare(`
    UPDATE api_keys SET last_used_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(id);
}

export function markApiKeyInvalid(id: string): void {
  const db = getDbInstance();
  db.prepare(`
    UPDATE api_keys SET status = 'invalid', updated_at = datetime('now')
    WHERE id = ?
  `).run(id);
}

export function clearApiKeyCooldown(id: string): void {
  const db = getDbInstance();
  db.prepare(`
    UPDATE api_keys SET cooldown_until = NULL, status = 'active', updated_at = datetime('now')
    WHERE id = ?
  `).run(id);
}
