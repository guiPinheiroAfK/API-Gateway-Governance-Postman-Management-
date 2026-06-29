import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  jwt: {
    secret: process.env.JWT_SECRET ?? 'orquestra-dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  },

  services: {
    users: {
      url: process.env.USERS_SERVICE_URL ?? 'http://localhost:8081',
      name: 'users-service',
    },
    products: {
      url: process.env.PRODUCTS_SERVICE_URL ?? 'http://localhost:8082',
      name: 'products-service',
    },
    orders: {
      url: process.env.ORDERS_SERVICE_URL ?? 'http://localhost:8083',
      name: 'orders-service',
    },
  },

  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  },
} as const;
