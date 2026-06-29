import { Router, Request, Response } from 'express';
import { metricsStore, checkServiceHealth } from '../metrics';
import { config } from '../config';
import { authenticate, requireRole } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * GET /health
 * Public health check for the gateway itself (used by load balancers and Docker).
 */
router.get('/health', (_req: Request, res: Response): void => {
  res.json({
    status: 'healthy',
    service: 'orquestra-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /api/v1/gateway/metrics
 * Admin-only endpoint exposing aggregated gateway metrics for the dashboard.
 */
router.get(
  '/api/v1/gateway/metrics',
  authenticate as unknown as (req: Request, res: Response, next: () => void) => void,
  requireRole('admin') as unknown as (req: Request, res: Response, next: () => void) => void,
  async (_req: Request, res: Response): Promise<void> => {
    const metrics = await metricsStore.collect(checkServiceHealth);
    res.json(metrics);
  }
);

/**
 * GET /api/v1/gateway/services
 * Returns health of all downstream microservices.
 */
router.get(
  '/api/v1/gateway/services',
  authenticate as unknown as (req: Request, res: Response, next: () => void) => void,
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    const services = await checkServiceHealth();
    res.json({ services });
  }
);

/**
 * GET /api/v1/gateway/routes
 * Lists all registered proxy routes (public docs endpoint).
 */
router.get('/api/v1/gateway/routes', (_req: Request, res: Response): void => {
  res.json({
    version: '1.0.0',
    routes: [
      {
        pattern: '/api/v1/users/**',
        target: config.services.users.url,
        auth: true,
        rateLimit: `${config.rateLimit.max} req/${config.rateLimit.windowMs / 1000}s`,
      },
      {
        pattern: '/api/v2/users/**',
        target: config.services.users.url,
        auth: true,
        rateLimit: `${config.rateLimit.max} req/${config.rateLimit.windowMs / 1000}s`,
        note: 'v2 returns paginated response with HAL links',
      },
      {
        pattern: '/api/v1/products/**',
        target: config.services.products.url,
        auth: true,
        rateLimit: `${config.rateLimit.max} req/${config.rateLimit.windowMs / 1000}s`,
      },
      {
        pattern: '/api/v1/orders/**',
        target: config.services.orders.url,
        auth: true,
        rateLimit: `${config.rateLimit.max} req/${config.rateLimit.windowMs / 1000}s`,
      },
      {
        pattern: '/api/v1/auth/**',
        target: 'gateway',
        auth: false,
        rateLimit: `${config.rateLimit.max} req/${config.rateLimit.windowMs / 1000}s`,
      },
    ],
  });
});

export default router;
