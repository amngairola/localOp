import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import 'express-async-errors';

import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { defaultRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { apiRouter } from './routes/index';
import { errorResponse } from './utils/response';

export function createApp(): Application {
  const app = express();

  // ── Security headers ───────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ───────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        const allowed = [env.FRONTEND_URL, 'http://localhost:3000'];
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin || allowed.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: origin ${origin} not allowed`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
    }),
  );

  // ── Request parsing ────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── Logging & rate limiting ────────────────────────────────────────────────
  app.use(requestLogger);
  app.use(defaultRateLimiter);

  // ── Trust proxy (Render/Railway/Fly.io sit behind a reverse proxy) ─────────
  app.set('trust proxy', 1);

  // ── Health check (no auth required) ───────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV,
      version: process.env.npm_package_version ?? '1.0.0',
    });
  });

  // ── API routes ─────────────────────────────────────────────────────────────
  app.use('/api/v1', apiRouter);

  // ── 404 handler ────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    errorResponse(res, 404, 'Route not found', 'NOT_FOUND');
  });

  // ── Centralized error handler (must be last) ───────────────────────────────
  app.use(errorHandler);

  return app;
}
