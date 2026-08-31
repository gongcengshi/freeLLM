import { getDbInstance } from './core.js';
import type { ModelScore } from '../types/index.js';

export function getModelScore(modelId: string, providerId: string): ModelScore | null {
  const db = getDbInstance();
  const row = db.prepare(`
    SELECT * FROM model_scores WHERE model_id = ? AND provider_id = ?
  `).get(modelId, providerId) as any;
  if (!row) return null;
  return {
    modelId: row.model_id,
    providerId: row.provider_id,
    health: row.health,
    speed: row.speed,
    quality: row.quality,
    availability: row.availability,
    reliability: row.reliability,
    totalScore: row.total_score,
    lastChecked: row.last_checked,
    lastUsed: row.last_used,
    errorCount: row.error_count,
    successCount: row.success_count,
  };
}

export function getAllModelScores(): ModelScore[] {
  const db = getDbInstance();
  const rows = db.prepare('SELECT * FROM model_scores ORDER BY total_score DESC').all() as any[];
  return rows.map(row => ({
    modelId: row.model_id,
    providerId: row.provider_id,
    health: row.health,
    speed: row.speed,
    quality: row.quality,
    availability: row.availability,
    reliability: row.reliability,
    totalScore: row.total_score,
    lastChecked: row.last_checked,
    lastUsed: row.last_used,
    errorCount: row.error_count,
    successCount: row.success_count,
  }));
}

export function getModelScoresByProvider(providerId: string): ModelScore[] {
  const db = getDbInstance();
  const rows = db.prepare(`
    SELECT * FROM model_scores WHERE provider_id = ? ORDER BY total_score DESC
  `).all(providerId) as any[];
  return rows.map(row => ({
    modelId: row.model_id,
    providerId: row.provider_id,
    health: row.health,
    speed: row.speed,
    quality: row.quality,
    availability: row.availability,
    reliability: row.reliability,
    totalScore: row.total_score,
    lastChecked: row.last_checked,
    lastUsed: row.last_used,
    errorCount: row.error_count,
    successCount: row.success_count,
  }));
}

export function upsertModelScore(score: ModelScore): void {
  const db = getDbInstance();
  db.prepare(`
    INSERT INTO model_scores (model_id, provider_id, health, speed, quality, availability, reliability, total_score, last_checked, last_used, error_count, success_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(model_id, provider_id) DO UPDATE SET
      health = ?,
      speed = ?,
      quality = ?,
      availability = ?,
      reliability = ?,
      total_score = ?,
      last_checked = ?,
      last_used = ?,
      error_count = ?,
      success_count = ?
  `).run(
    score.modelId, score.providerId,
    score.health, score.speed, score.quality, score.availability, score.reliability, score.totalScore,
    score.lastChecked, score.lastUsed, score.errorCount, score.successCount,
    score.health, score.speed, score.quality, score.availability, score.reliability, score.totalScore,
    score.lastChecked, score.lastUsed, score.errorCount, score.successCount
  );
}

export function updateModelScoreError(modelId: string, providerId: string): void {
  const db = getDbInstance();
  const existing = getModelScore(modelId, providerId);
  if (existing) {
    const newErrorCount = existing.errorCount + 1;
    const newReliability = Math.max(0, existing.reliability - 5);
    const newTotalScore = calculateTotalScore(existing.health, existing.speed, existing.quality, existing.availability, newReliability);
    db.prepare(`
      UPDATE model_scores SET
        error_count = ?,
        reliability = ?,
        total_score = ?,
        last_checked = datetime('now')
      WHERE model_id = ? AND provider_id = ?
    `).run(newErrorCount, newReliability, newTotalScore, modelId, providerId);
  }
}

export function updateModelScoreSuccess(modelId: string, providerId: string, latencyMs: number): void {
  const db = getDbInstance();
  const existing = getModelScore(modelId, providerId);
  if (existing) {
    const newSuccessCount = existing.successCount + 1;
    const newReliability = Math.min(100, existing.reliability + 1);
    const speedScore = Math.max(0, 100 - (latencyMs / 100));
    const newSpeed = (existing.speed * 0.8 + speedScore * 0.2);
    const newTotalScore = calculateTotalScore(existing.health, newSpeed, existing.quality, existing.availability, newReliability);
    db.prepare(`
      UPDATE model_scores SET
        success_count = ?,
        reliability = ?,
        speed = ?,
        total_score = ?,
        last_used = datetime('now'),
        last_checked = datetime('now')
      WHERE model_id = ? AND provider_id = ?
    `).run(newSuccessCount, newReliability, newSpeed, newTotalScore, modelId, providerId);
  } else {
    const speedScore = Math.max(0, 100 - (latencyMs / 100));
    const newScore: ModelScore = {
      modelId,
      providerId,
      health: 100,
      speed: speedScore,
      quality: 50,
      availability: 100,
      reliability: 60,
      totalScore: calculateTotalScore(100, speedScore, 50, 100, 60),
      lastChecked: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      errorCount: 0,
      successCount: 1,
    };
    upsertModelScore(newScore);
  }
}

function calculateTotalScore(
  health: number,
  speed: number,
  quality: number,
  availability: number,
  reliability: number
): number {
  return (
    health * 0.25 +
    speed * 0.2 +
    quality * 0.2 +
    availability * 0.15 +
    reliability * 0.2
  );
}
