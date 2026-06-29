import winston from 'winston';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../types';
import { metricsStore } from '../metrics';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `[${timestamp}] ${level}: ${message}${metaStr}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
  ],
});

export function correlationMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  req.correlationId = (req.headers['x-correlation-id'] as string) ?? uuidv4();
  next();
}

export function requestLogger(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, path: reqPath, ip } = req;

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const statusCode = res.statusCode;
    const service = resolveServiceName(reqPath);

    logger.info('request completed', {
      correlationId: req.correlationId,
      method,
      path: reqPath,
      statusCode,
      durationMs,
      service,
      ip,
      user: req.user?.sub,
    });

    metricsStore.record({
      timestamp: Date.now(),
      method,
      path: reqPath,
      statusCode,
      durationMs,
      service,
      ip: ip ?? 'unknown',
      rateLimited: statusCode === 429,
    });
  });

  next();
}

function resolveServiceName(path: string): string {
  if (path.includes('/users')) return 'users-service';
  if (path.includes('/products')) return 'products-service';
  if (path.includes('/orders')) return 'orders-service';
  if (path.includes('/auth')) return 'gateway';
  return 'gateway';
}
