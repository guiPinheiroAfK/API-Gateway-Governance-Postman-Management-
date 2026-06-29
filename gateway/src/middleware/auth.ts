import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthenticatedRequest, JwtPayload } from '../types';
import { GatewayError } from './errorHandler';

export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(
      new GatewayError(
        401,
        'Unauthorized',
        'Missing or malformed Authorization header. Expected: Bearer <token>',
        'https://orquestra-gateway.dev/errors/401'
      )
    );
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = payload;

    // Propagate user identity to downstream services via headers
    req.headers['x-user-id'] = payload.sub;
    req.headers['x-user-email'] = payload.email;
    req.headers['x-user-role'] = payload.role;
    req.headers['x-correlation-id'] = req.correlationId;

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(
        new GatewayError(
          401,
          'Token Expired',
          'The provided JWT token has expired. Please authenticate again.',
          'https://orquestra-gateway.dev/errors/401'
        )
      );
      return;
    }

    next(
      new GatewayError(
        401,
        'Invalid Token',
        'The provided JWT token is invalid or has been tampered with.',
        'https://orquestra-gateway.dev/errors/401'
      )
    );
  }
}

export function requireRole(role: 'admin' | 'user') {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new GatewayError(401, 'Unauthorized', 'Authentication required.'));
      return;
    }

    if (role === 'admin' && req.user.role !== 'admin') {
      next(
        new GatewayError(
          403,
          'Forbidden',
          'Admin role required to access this resource.',
          'https://orquestra-gateway.dev/errors/403'
        )
      );
      return;
    }

    next();
  };
}
