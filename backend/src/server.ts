import { validateEnv, env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initRedis } from './config/redis';
import { logger } from './utils/logger';
import { createApp } from './app';

async function main(): Promise<void> {
  // ── 1. Validate environment variables — fail fast ──────────────────────────
  validateEnv();
  logger.info('✅ Environment validated');

  // ── 2. Connect to database ─────────────────────────────────────────────────
  await connectDatabase();

  // ── 3. Connect to Redis cache ──────────────────────────────────────────────
  await initRedis();

  // ── 4. Build Express app ───────────────────────────────────────────────────
  const app = createApp();

  // ── 5. Start HTTP server ───────────────────────────────────────────────────
  const port = env.PORT;
  const server = app.listen(port, '0.0.0.0', () => {
    logger.info(`🚀 LifeOps API running on port ${port} [${env.NODE_ENV}]`);
  });

  // ── 6. Graceful shutdown ───────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully`);

    server.close(async () => {
      logger.info('HTTP server closed');
      await disconnectDatabase();
      logger.info('Goodbye 👋');
      process.exit(0);
    });

    // Force exit after 10 s if still open
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled promise rejection');
    process.exit(1);
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception');
    process.exit(1);
  });
}

main().catch((error) => {
  logger.fatal({ err: error }, 'Fatal startup error');
  process.exit(1);
});
