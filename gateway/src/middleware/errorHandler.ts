import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, ProblemDetails } from '../types';
import { logger } from './logger';

const BASE_TYPE_URI = 'https://orquestra-gateway.dev/errors';

export class GatewayError extends Error {
  constructor(
    public readonly status: number,
    public readonly title: string,
    public readonly detail: string,
    public readonly type?: string
  ) {
    super(detail);
    this.name = 'GatewayError';
  }
}

export function createProblemDetails(
  status: number,
  title: string,
  detail: string,
  instance: string,
  correlationId?: string,
  type?: string
): ProblemDetails {
  return {
    type: type ?? `${BASE_TYPE_URI}/${status}`,
    title,
    status,
    detail,
    instance,
    correlationId,
    timestamp: new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, req: AuthenticatedRequest, res: Response, _next: NextFunction): void {
  const instance = req.path;
  const correlationId = req.correlationId;

  if (err instanceof GatewayError) {
    const problem = createProblemDetails(err.status, err.title, err.detail, instance, correlationId, err.type);
    logger.warn('gateway error', { correlationId, status: err.status, detail: err.detail });
    res.status(err.status).contentType('application/problem+json').json(problem);
    return;
  }

  logger.error('unhandled error', {
    correlationId,
    message: err.message,
    stack: err.stack,
  });

  const problem = createProblemDetails(
    500,
    'Internal Server Error',
    'An unexpected error occurred. Please try again later.',
    instance,
    correlationId,
    `${BASE_TYPE_URI}/500`
  );
  res.status(500).contentType('application/problem+json').json(problem);
}

export function notFoundHandler(req: Request, res: Response): void {
  const problem = createProblemDetails(
    404,
    'Not Found',
    `The requested resource '${req.path}' was not found on this server.`,
    req.path,
    undefined,
    `${BASE_TYPE_URI}/404`
  );
  res.status(404).contentType('application/problem+json').json(problem);
}
