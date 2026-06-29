import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'admin' | 'user';
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  correlationId?: string;
}

export interface ServiceRoute {
  target: string;
  pathRewrite?: Record<string, string>;
  requiresAuth: boolean;
  version: 'v1' | 'v2' | 'both';
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  correlationId?: string;
  timestamp: string;
}

export interface MetricEntry {
  timestamp: number;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  service: string;
  ip: string;
  rateLimited: boolean;
}

export interface ServiceHealth {
  name: string;
  url: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  lastChecked: string;
}

export interface GatewayMetrics {
  uptime: number;
  totalRequests: number;
  requestsPerMinute: number;
  averageLatencyMs: number;
  rateLimitedCount: number;
  errorCount: number;
  recentRequests: MetricEntry[];
  services: ServiceHealth[];
}
