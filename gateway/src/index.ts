import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { correlationMiddleware, requestLogger, logger } from './middleware/logger';
import { rateLimiter, initRedis } from './middleware/rateLimiter';
import { authenticate } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { usersProxy, productsProxy, ordersProxy } from './proxy';
import authRouter from './routes/auth';
import gatewayRouter from './routes/gateway';

const app = express();

// Security headers
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json());

// Observability
app.use(correlationMiddleware);
app.use(requestLogger);

// Gateway meta-routes (no auth required for health + auth)
app.use(gatewayRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v2/auth', authRouter);

// Apply rate limiter to all API routes
app.use('/api', rateLimiter);

// Protected proxy routes — v1 and v2 both supported
const authMiddleware = authenticate as express.RequestHandler;

app.use('/api/v1/users', authMiddleware, usersProxy);
app.use('/api/v2/users', authMiddleware, usersProxy);

app.use('/api/v1/products', authMiddleware, productsProxy);
app.use('/api/v2/products', authMiddleware, productsProxy);

app.use('/api/v1/orders', authMiddleware, ordersProxy);
app.use('/api/v2/orders', authMiddleware, ordersProxy);

// 404 and error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

async function start(): Promise<void> {
  initRedis();

  app.listen(config.port, () => {
    logger.info(`Orquestra Gateway started`, {
      port: config.port,
      env: config.nodeEnv,
      services: {
        users: config.services.users.url,
        products: config.services.products.url,
        orders: config.services.orders.url,
      },
    });
  });
}

start();
