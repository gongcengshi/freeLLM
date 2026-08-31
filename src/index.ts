import 'dotenv/config';
import { server, logger } from './server/app.js';
import { getDbInstance, closeDb } from './db/core.js';
import { runMigrations } from './db/migrate.js';
import { healthChecker } from './services/health.js';

const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

async function main(): Promise<void> {
  // Initialize database
  logger.info('Initializing database...');
  getDbInstance();
  runMigrations();

  // Start health checker
  logger.info('Starting health checker...');
  healthChecker.start();

  // Start server
  server.listen(PORT, HOST, () => {
    logger.info(`FreeLLM server running at http://${HOST}:${PORT}`);
    logger.info(`API endpoint: http://${HOST}:${PORT}/v1/chat/completions`);
    logger.info(`Admin panel: http://${HOST}:${PORT}/admin`);
    logger.info(`WebSocket: ws://${HOST}:${PORT}/ws`);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down...');
  healthChecker.stop();
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down...');
  healthChecker.stop();
  closeDb();
  process.exit(0);
});

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
