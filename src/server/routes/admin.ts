import { Router, type Request, type Response } from 'express';
import { getAllProviders, getProviderById, createProvider, updateProvider, deleteProvider } from '../../db/providers.js';
import { getAllApiKeys, getApiKeyById, createApiKey, updateApiKey, deleteApiKey } from '../../db/apiKeys.js';
import { getRequestLogs, getRequestLogStats } from '../../db/logs.js';
import { getAllModelScores, getModelScoresByProvider } from '../../db/modelScores.js';
import { getDbInstance } from '../../db/core.js';
import { healthChecker } from '../../services/health.js';
import { keyValidator } from '../../services/keyValidator.js';
import { encrypt } from '../../utils/crypto.js';
import { requireAdmin } from '../middleware/auth.js';
import type { ProviderConfig } from '../../types/index.js';

const router = Router();

// Apply admin auth to all routes
router.use(requireAdmin);

// ===== Providers =====

router.get('/providers', (_req: Request, res: Response) => {
  const providers = getAllProviders();
  res.json(providers);
});

router.get('/providers/:id', (req: Request, res: Response) => {
  const provider = getProviderById(req.params.id as string);
  if (!provider) {
    res.status(404).json({ error: 'Provider not found' });
    return;
  }
  res.json(provider);
});

router.post('/providers', (req: Request, res: Response) => {
  try {
    const provider: ProviderConfig = req.body;
    createProvider(provider);
    res.status(201).json(provider);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid provider data' });
  }
});

router.put('/providers/:id', (req: Request, res: Response) => {
  try {
    updateProvider(req.params.id as string, req.body);
    const updated = getProviderById(req.params.id as string);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid update data' });
  }
});

router.delete('/providers/:id', (req: Request, res: Response) => {
  deleteProvider(req.params.id as string);
  res.status(204).end();
});

// ===== API Keys =====

router.get('/api-keys', (_req: Request, res: Response) => {
  const keys = getAllApiKeys();
  // Mask keys in response
  const maskedKeys = keys.map(k => ({
    ...k,
    key: k.key.slice(0, 8) + '...' + k.key.slice(-4),
  }));
  res.json(maskedKeys);
});

router.get('/api-keys/:id', (req: Request, res: Response) => {
  const key = getApiKeyById(req.params.id as string);
  if (!key) {
    res.status(404).json({ error: 'API key not found' });
    return;
  }
  res.json({
    ...key,
    key: key.key.slice(0, 8) + '...' + key.key.slice(-4),
  });
});

router.post('/api-keys', (req: Request, res: Response) => {
  try {
    const { providerId, name, key } = req.body;
    if (!providerId || !name || !key) {
      res.status(400).json({ error: 'Missing required fields: providerId, name, key' });
      return;
    }
    const encryptedKey = encrypt(key);
    const created = createApiKey(providerId, name, encryptedKey);
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid key data' });
  }
});

router.put('/api-keys/:id', (req: Request, res: Response) => {
  try {
    const updates: any = { ...req.body };
    if (updates.key) {
      updates.key = encrypt(updates.key);
    }
    updateApiKey(req.params.id as string, updates);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid update data' });
  }
});

router.delete('/api-keys/:id', (req: Request, res: Response) => {
  deleteApiKey(req.params.id as string);
  res.status(204).end();
});

// ===== Logs =====

router.get('/logs', (req: Request, res: Response) => {
  const { limit, offset, providerId, startTime, endTime, status } = req.query;
  const logs = getRequestLogs({
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
    providerId: providerId as string,
    startTime: startTime as string,
    endTime: endTime as string,
    status: status as string,
  });
  res.json(logs);
});

router.get('/logs/stats', (req: Request, res: Response) => {
  const { startTime, endTime, providerId } = req.query;
  const stats = getRequestLogStats({
    startTime: startTime as string,
    endTime: endTime as string,
    providerId: providerId as string,
  });
  res.json(stats);
});

// ===== Usage Statistics =====

router.get('/usage/daily', (req: Request, res: Response) => {
  const { days } = req.query;
  const numDays = parseInt(days as string) || 7;
  
  const db = getDbInstance();
  const dailyStats = db.prepare(`
    SELECT
      date(timestamp) as date,
      COUNT(*) as requests,
      SUM(total_tokens) as tokens,
      AVG(latency_ms) as avg_latency,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
      SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count
    FROM request_logs
    WHERE timestamp >= datetime('now', ?)
    GROUP BY date(timestamp)
    ORDER BY date(timestamp) DESC
  `).all(`-${numDays} days`);
  
  res.json(dailyStats);
});

router.get('/usage/by-model', (req: Request, res: Response) => {
  const { days } = req.query;
  const numDays = parseInt(days as string) || 7;
  
  const db = getDbInstance();
  const modelStats = db.prepare(`
    SELECT
      model,
      COUNT(*) as requests,
      SUM(total_tokens) as tokens,
      AVG(latency_ms) as avg_latency
    FROM request_logs
    WHERE timestamp >= datetime('now', ?)
    GROUP BY model
    ORDER BY requests DESC
  `).all(`-${numDays} days`);
  
  res.json(modelStats);
});

// ===== Model Scores =====

router.get('/scores', (req: Request, res: Response) => {
  const { providerId } = req.query;
  const scores = providerId 
    ? getModelScoresByProvider(providerId as string)
    : getAllModelScores();
  res.json(scores);
});

// ===== Health =====

router.get('/health', async (_req: Request, res: Response) => {
  const results = await healthChecker.runChecks();
  res.json(results);
});

router.get('/health/:providerId', async (req: Request, res: Response) => {
  const result = await healthChecker.checkSingleProvider(req.params.providerId as string);
  if (!result) {
    res.status(404).json({ error: 'Provider not found' });
    return;
  }
  res.json(result);
});

// ===== Key Validation =====

router.post('/validate-keys', async (_req: Request, res: Response) => {
  const results = await keyValidator.validateAllKeys();
  res.json(results);
});

router.post('/validate-keys/:providerId', async (req: Request, res: Response) => {
  const results = await keyValidator.validateAllKeysForProvider(req.params.providerId as string);
  res.json(results);
});

router.post('/validate-keys/:providerId/:apiKeyId', async (req: Request, res: Response) => {
  const result = await keyValidator.validateKey(
    req.params.providerId as string,
    req.params.apiKeyId as string
  );
  res.json(result);
});

export default router;
