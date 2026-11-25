import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ]
        : [{ emit: 'event', level: 'error' }],
    errorFormat: 'pretty',
  });
}

// Singleton — reuse in development to avoid too many connections during hot reload
export const prisma: PrismaClient =
  process.env.NODE_ENV === 'production'
    ? createPrismaClient()
    : (globalThis.__prisma ?? (globalThis.__prisma = createPrismaClient()));

if (process.env.NODE_ENV === 'development') {
  (prisma as unknown as { $on: (event: string, cb: (e: unknown) => void) => void }).$on(
    'query',
    (e: unknown) => {
      const event = e as { query: string; duration: number };
      logger.debug({ query: event.query, duration: `${event.duration}ms` }, 'Prisma query');
    },
  );
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
  } catch (error) {
    logger.error({ error }, '❌ Database connection failed');
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error({ error }, 'Error disconnecting database');
  }
}
