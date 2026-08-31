import { getDbInstance } from './core.js';

export function getSetting(key: string): string | null {
  const db = getDbInstance();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string, description?: string): void {
  const db = getDbInstance();
  db.prepare(`
    INSERT INTO settings (key, value, description, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')
  `).run(key, value, description || null, value);
}

export function getAllSettings(): Record<string, string> {
  const db = getDbInstance();
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

export function deleteSetting(key: string): void {
  const db = getDbInstance();
  db.prepare('DELETE FROM settings WHERE key = ?').run(key);
}
