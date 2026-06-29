import { MetricEntry, GatewayMetrics, ServiceHealth } from '../types';
import { config } from '../config';

const MAX_RECENT = 100;
const ONE_MINUTE = 60_000;

class MetricsStore {
  private entries: MetricEntry[] = [];
  private startTime = Date.now();

  record(entry: MetricEntry): void {
    this.entries.push(entry);
    if (this.entries.length > MAX_RECENT) {
      this.entries.shift();
    }
  }

  async collect(serviceHealthFn: () => Promise<ServiceHealth[]>): Promise<GatewayMetrics> {
    const now = Date.now();
    const uptime = Math.floor((now - this.startTime) / 1000);

    const windowStart = now - ONE_MINUTE;
    const recentInWindow = this.entries.filter((e) => e.timestamp >= windowStart);

    const totalRequests = this.entries.length;
    const requestsPerMinute = recentInWindow.length;
    const rateLimitedCount = this.entries.filter((e) => e.rateLimited).length;
    const errorCount = this.entries.filter((e) => e.statusCode >= 500).length;

    const avgLatency =
      this.entries.length > 0
        ? Math.round(this.entries.reduce((sum, e) => sum + e.durationMs, 0) / this.entries.length)
        : 0;

    const services = await serviceHealthFn();

    return {
      uptime,
      totalRequests,
      requestsPerMinute,
      averageLatencyMs: avgLatency,
      rateLimitedCount,
      errorCount,
      recentRequests: [...this.entries].reverse().slice(0, 20),
      services,
    };
  }
}

export const metricsStore = new MetricsStore();

export async function checkServiceHealth(): Promise<ServiceHealth[]> {
  const services = [
    { name: config.services.users.name, url: config.services.users.url },
    { name: config.services.products.name, url: config.services.products.url },
    { name: config.services.orders.name, url: config.services.orders.url },
  ];

  return Promise.all(
    services.map(async ({ name, url }) => {
      const start = Date.now();
      try {
        const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) });
        const latencyMs = Date.now() - start;
        return {
          name,
          url,
          status: res.ok ? ('healthy' as const) : ('degraded' as const),
          latencyMs,
          lastChecked: new Date().toISOString(),
        };
      } catch {
        return {
          name,
          url,
          status: 'down' as const,
          latencyMs: Date.now() - start,
          lastChecked: new Date().toISOString(),
        };
      }
    })
  );
}
