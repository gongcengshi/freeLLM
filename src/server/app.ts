import express from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import v1Routes from './routes/v1.js';
import adminRoutes from './routes/admin.js';
import { requireProxyApiKey } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
});

const app = express();
const server = http.createServer(app);

// WebSocket server for real-time monitoring
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  logger.info('WebSocket client connected');
  
  ws.on('close', () => {
    logger.info('WebSocket client disconnected');
  });
});

export function broadcastWsMessage(message: any): void {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Security middleware - disable CSP to allow inline scripts
app.use((_req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Freellm-Strategy'],
  exposedHeaders: ['X-Freellm-Provider', 'X-Freellm-Model', 'X-Freellm-Latency-Ms'],
}));

// Compression
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many requests, please try again later',
      type: 'rate_limit_error',
    },
  },
});
app.use(limiter);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
    });
  });
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// V1 API routes (with proxy API key auth)
app.use('/v1', requireProxyApiKey, v1Routes);

// Admin routes (with admin auth)
app.use('/admin', adminRoutes);

// Static files (landing page)
const publicPath = path.resolve(__dirname, '../../public');
app.use(express.static(publicPath));

// SPA fallback - serve index.html for non-API routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// 404 handler for API routes
app.use((_req, res) => {
  res.status(404).json({
    error: {
      message: 'Not found',
      type: 'not_found',
    },
  });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      type: 'server_error',
    },
  });
});

export { app, server, logger };
