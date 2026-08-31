import { getDbInstance } from './core.js';

const migrations = [
  // V1: Initial schema
  {
    version: 1,
    up: `
      CREATE TABLE IF NOT EXISTS providers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'openai-compatible',
        base_url TEXT NOT NULL,
        auth_type TEXT NOT NULL DEFAULT 'api-key',
        models TEXT NOT NULL DEFAULT '[]',
        rate_limits TEXT NOT NULL DEFAULT '{}',
        features TEXT NOT NULL DEFAULT '{}',
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        provider_id TEXT NOT NULL,
        name TEXT NOT NULL,
        key TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_used_at TEXT,
        last_checked_at TEXT,
        cooldown_until TEXT,
        usage TEXT NOT NULL DEFAULT '{}',
        FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS request_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        model TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        api_key_id TEXT NOT NULL,
        status TEXT NOT NULL,
        prompt_tokens INTEGER NOT NULL DEFAULT 0,
        completion_tokens INTEGER NOT NULL DEFAULT 0,
        total_tokens INTEGER NOT NULL DEFAULT 0,
        latency_ms INTEGER NOT NULL DEFAULT 0,
        error TEXT
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS model_scores (
        model_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        health REAL NOT NULL DEFAULT 100,
        speed REAL NOT NULL DEFAULT 50,
        quality REAL NOT NULL DEFAULT 50,
        availability REAL NOT NULL DEFAULT 100,
        reliability REAL NOT NULL DEFAULT 100,
        total_score REAL NOT NULL DEFAULT 50,
        last_checked TEXT NOT NULL DEFAULT (datetime('now')),
        last_used TEXT,
        error_count INTEGER NOT NULL DEFAULT 0,
        success_count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (model_id, provider_id)
      );

      CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys(provider_id);
      CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);
      CREATE INDEX IF NOT EXISTS idx_request_logs_timestamp ON request_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_request_logs_provider ON request_logs(provider_id);
      CREATE INDEX IF NOT EXISTS idx_model_scores_provider ON model_scores(provider_id);
    `,
  },
];

export function runMigrations(): void {
  const db = getDbInstance();
  
  // Create migrations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Get applied migrations
  const applied = db.prepare('SELECT version FROM migrations').all() as { version: number }[];
  const appliedVersions = new Set(applied.map(m => m.version));

  // Run pending migrations
  for (const migration of migrations) {
    if (!appliedVersions.has(migration.version)) {
      console.log(`Running migration V${migration.version}...`);
      db.transaction(() => {
        db.exec(migration.up);
        db.prepare('INSERT INTO migrations (version) VALUES (?)').run(migration.version);
      })();
      console.log(`Migration V${migration.version} completed.`);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
  console.log('All migrations completed.');
  process.exit(0);
}
