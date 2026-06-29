export interface ServiceHealth {
  name: string;
  url: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  lastChecked: string;
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

export interface AuthState {
  token: string | null;
  role: 'admin' | 'user' | null;
  email: string | null;
}
