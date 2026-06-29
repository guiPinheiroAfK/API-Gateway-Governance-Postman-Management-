import { Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { config } from '../config';
import { AuthenticatedRequest } from '../types';
import { GatewayError } from './errorHandler';
import { logger } from './logger';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

// In-memory fallback when Redis is unavailable
const inMemoryStore = new Map<string, TokenBucket>();

let redisClient: Redis | null = null;
let redisAvailable = false;

export function initRedis(): void {
  try {
    redisClient = new Redis(config.redis.url, {
      lazyConnect: true,
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
    });

    redisClient.on('connect', () => {
      redisAvailable = true;
      logger.info('Redis connected — rate limiter using distributed store');
    });

    redisClient.on('error', () => {
      redisAvailable = false;
      logger.warn('Redis unavailable — rate limiter falling back to in-memory store');
    });

    redisClient.connect().catch(() => {
      redisAvailable = false;
      logger.warn('Redis connection failed — rate limiter using in-memory store');
    });
  } catch {
    logger.warn('Redis init failed — rate limiter using in-memory store');
  }
}

const { windowMs, max } = config.rateLimit;
const refillRate = max / (windowMs / 1000); // tokens per second

async function getTokensRedis(key: string): Promise<TokenBucket> {
  const data = await redisClient!.get(key);
  if (!data) {
    return { tokens: max, lastRefill: Date.now() };
  }
  return JSON.parse(data) as TokenBucket;
}

async function setTokensRedis(key: string, bucket: TokenBucket): Promise<void> {
  await redisClient!.set(key, JSON.stringify(bucket), 'PX', windowMs * 2);
}

function getTokensMemory(key: string): TokenBucket {
  return inMemoryStore.get(key) ?? { tokens: max, lastRefill: Date.now() };
}

function setTokensMemory(key: string, bucket: TokenBucket): void {
  inMemoryStore.set(key, bucket);
}

function refill(bucket: TokenBucket): TokenBucket {
  const now = Date.now();
  const elapsed = (now - bucket.lastRefill) / 1000; // seconds
  const newTokens = Math.min(max, bucket.tokens + elapsed * refillRate);
  return { tokens: newTokens, lastRefill: now };
}

async function consumeToken(ip: string): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
  const key = `rate:${ip}`;

  let bucket: TokenBucket;

  if (redisAvailable && redisClient) {
    bucket = await getTokensRedis(key);
  } else {
    bucket = getTokensMemory(key);
  }

  bucket = refill(bucket);

  const allowed = bucket.tokens >= 1;
  if (allowed) {
    bucket.tokens -= 1;
  }

  if (redisAvailable && redisClient) {
    await setTokensRedis(key, bucket);
  } else {
    setTokensMemory(key, bucket);
  }

  const secondsUntilReset = (1 / refillRate) * 1000; // ms until next token

  return {
    allowed,
    remaining: Math.floor(bucket.tokens),
    resetMs: Math.ceil(secondsUntilReset),
  };
}

export async function rateLimiter(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';

  const { allowed, remaining, resetMs } = await consumeToken(ip);

  res.setHeader('X-RateLimit-Limit', max);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', resetMs);
  res.setHeader('X-RateLimit-Policy', `${max};w=${windowMs / 1000}`);

  if (!allowed) {
    res.setHeader('Retry-After', Math.ceil(resetMs / 1000));
    next(
      new GatewayError(
        429,
        'Too Many Requests',
        `Rate limit exceeded. You are allowed ${max} requests per ${windowMs / 1000}s window. Retry after ${Math.ceil(resetMs / 1000)}s.`,
        'https://orquestra-gateway.dev/errors/429'
      )
    );
    return;
  }

  next();
}
