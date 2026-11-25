import { Redis } from '@upstash/redis';
import { env } from './env';
import { logger } from '../utils/logger';

let _redis: Redis | null = null;
let _redisAvailable = false;

export function getRedis(): Redis | null {
  if (!_redis) {
    const url = env.UPSTASH_REDIS_REST_URL || env.REDIS_URL;
    const token = env.UPSTASH_REDIS_REST_TOKEN || '';

    if (!url || !token) {
      return null;
    }

    try {
      _redis = new Redis({ url, token, automaticDeserialization: true });
    } catch (err) {
      logger.warn({ err }, 'Failed to initialize Redis client — caching disabled');
      return null;
    }
  }
  return _redis;
}

export async function initRedis(): Promise<void> {
  const client = getRedis();
  if (!client) {
    logger.warn('ℹ️ Redis not configured — running with Redis caching disabled');
    _redisAvailable = false;
    return;
  }

  try {
    await client.ping();
    _redisAvailable = true;
    logger.info('✅ Redis connected successfully');
  } catch (error) {
    logger.warn({ error }, '⚠️ Redis connection failed — caching disabled');
    _redisAvailable = false;
  }
}

// ── Cache helpers ────────────────────────────────────────────────────────────

const DEFAULT_TTL_SECONDS = 300; // 5 minutes

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!_redisAvailable) return null;
  const client = getRedis();
  if (!client) return null;

  try {
    return await client.get<T>(key);
  } catch (error) {
    logger.warn({ error, key }, 'Cache GET failed — continuing without cache');
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<void> {
  if (!_redisAvailable) return;
  const client = getRedis();
  if (!client) return;

  try {
    await client.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    logger.warn({ error, key }, 'Cache SET failed — continuing without cache');
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (!_redisAvailable || keys.length === 0) return;
  const client = getRedis();
  if (!client) return;

  try {
    await client.del(...keys);
  } catch (error) {
    logger.warn({ error, keys }, 'Cache DEL failed');
  }
}

export function userCacheKey(userId: string, ...parts: string[]): string {
  return `user:${userId}:${parts.join(':')}`;
}
