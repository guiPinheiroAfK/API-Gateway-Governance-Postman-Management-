import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { RequestHandler } from 'express';
import { config } from '../config';
import { logger } from '../middleware/logger';

function buildProxy(target: string, pathPrefix: string): RequestHandler {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { [`^/api/v[12]${pathPrefix}`]: pathPrefix },
    on: {
      proxyReq: fixRequestBody,
      error: (err, _req, res) => {
        logger.error('proxy error', { target, error: (err as Error).message });
        if (!res.headersSent) {
          (res as import('express').Response)
            .status(502)
            .contentType('application/problem+json')
            .json({
              type: 'https://orquestra-gateway.dev/errors/502',
              title: 'Bad Gateway',
              status: 502,
              detail: `Upstream service at ${target} is unavailable.`,
              instance: (res as unknown as { req: import('express').Request }).req?.path ?? '/',
              timestamp: new Date().toISOString(),
            });
        }
      },
    },
  }) as RequestHandler;
}

export const usersProxy = buildProxy(config.services.users.url, '/users');
export const productsProxy = buildProxy(config.services.products.url, '/products');
export const ordersProxy = buildProxy(config.services.orders.url, '/orders');
