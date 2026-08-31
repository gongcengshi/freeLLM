import { getDbInstance } from './core.js';
import type { ProviderConfig } from '../types/index.js';

export function getAllProviders(): ProviderConfig[] {
  const db = getDbInstance();
  const rows = db.prepare('SELECT * FROM providers WHERE enabled = 1').all() as any[];
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    type: row.type,
    baseUrl: row.base_url,
    authType: row.auth_type,
    models: JSON.parse(row.models),
    rateLimits: JSON.parse(row.rate_limits),
    features: JSON.parse(row.features),
    enabled: row.enabled === 1,
  }));
}

export function getProviderById(id: string): ProviderConfig | null {
  const db = getDbInstance();
  const row = db.prepare('SELECT * FROM providers WHERE id = ?').get(id) as any;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    baseUrl: row.base_url,
    authType: row.auth_type,
    models: JSON.parse(row.models),
    rateLimits: JSON.parse(row.rate_limits),
    features: JSON.parse(row.features),
    enabled: row.enabled === 1,
  };
}

export function createProvider(provider: ProviderConfig): void {
  const db = getDbInstance();
  db.prepare(`
    INSERT INTO providers (id, name, type, base_url, auth_type, models, rate_limits, features, enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    provider.id,
    provider.name,
    provider.type,
    provider.baseUrl,
    provider.authType,
    JSON.stringify(provider.models),
    JSON.stringify(provider.rateLimits),
    JSON.stringify(provider.features),
    provider.enabled ? 1 : 0
  );
}

export function updateProvider(id: string, updates: Partial<ProviderConfig>): void {
  const db = getDbInstance();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
  if (updates.baseUrl !== undefined) { fields.push('base_url = ?'); values.push(updates.baseUrl); }
  if (updates.authType !== undefined) { fields.push('auth_type = ?'); values.push(updates.authType); }
  if (updates.models !== undefined) { fields.push('models = ?'); values.push(JSON.stringify(updates.models)); }
  if (updates.rateLimits !== undefined) { fields.push('rate_limits = ?'); values.push(JSON.stringify(updates.rateLimits)); }
  if (updates.features !== undefined) { fields.push('features = ?'); values.push(JSON.stringify(updates.features)); }
  if (updates.enabled !== undefined) { fields.push('enabled = ?'); values.push(updates.enabled ? 1 : 0); }

  if (fields.length === 0) return;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE providers SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteProvider(id: string): void {
  const db = getDbInstance();
  db.prepare('DELETE FROM providers WHERE id = ?').run(id);
}

export function getProviderCount(): number {
  const db = getDbInstance();
  const row = db.prepare('SELECT COUNT(*) as count FROM providers').get() as { count: number };
  return row.count;
}
