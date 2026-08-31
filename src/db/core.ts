import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

let db: Database.Database | null = null;

function getDataDir(): string {
  const dataDir = process.env.DATA_DIR || path.join(os.homedir(), '.freellm');
  const expanded = dataDir.replace('~', os.homedir());
  if (!fs.existsSync(expanded)) {
    fs.mkdirSync(expanded, { recursive: true });
  }
  return expanded;
}

export function getDbPath(): string {
  return path.join(getDataDir(), 'freellm.db');
}

export function getDbInstance(): Database.Database {
  if (!db) {
    const dbPath = getDbPath();
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function resetDbInstance(): void {
  closeDb();
}
