import { useMetrics } from '../hooks/useMetrics';
import StatCard from './StatCard';
import ServiceHealth from './ServiceHealth';
import RequestLog from './RequestLog';
import LatencyChart from './LatencyChart';

interface Props {
  email: string;
  role: string;
  onLogout: () => void;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function Dashboard({ email, role, onLogout }: Props) {
  const isAdmin = role === 'admin';
  const { metrics, error, loading } = useMetrics(isAdmin);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center glow-blue">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Orquestra Gateway</h1>
              <p className="text-xs text-gray-500">API Control Panel</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-400">Gateway online</span>
            </div>
            <div className="h-4 w-px bg-gray-700" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white">
                {email[0].toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-white">{email}</p>
                <p className="text-xs text-gray-500 capitalize">{role}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="text-xs text-gray-500 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-gray-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Non-admin notice */}
        {!isAdmin && (
          <div className="bg-yellow-950/50 border border-yellow-800 rounded-xl px-5 py-4 text-yellow-300 text-sm">
            Metrics dashboard is <strong>admin-only</strong>. Sign in as <code className="font-mono text-xs bg-yellow-900/50 px-1.5 py-0.5 rounded">admin@orquestra.dev</code> to view gateway telemetry.
          </div>
        )}

        {/* Loading */}
        {loading && !metrics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse h-24" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-950 border border-red-800 rounded-xl px-5 py-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {metrics && (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Requests"
                value={metrics.totalRequests.toLocaleString()}
                sub={`${metrics.requestsPerMinute} req/min`}
                color="blue"
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              />
              <StatCard
                label="Avg Latency"
                value={`${metrics.averageLatencyMs}ms`}
                sub="across all routes"
                color="purple"
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <StatCard
                label="Rate Limited"
                value={metrics.rateLimitedCount}
                sub="429 responses"
                color="yellow"
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
              />
              <StatCard
                label="Uptime"
                value={formatUptime(metrics.uptime)}
                sub="gateway process"
                color="green"
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
            </div>

            {/* Chart + services row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3">
                <LatencyChart requests={metrics.recentRequests} />
              </div>
              <div className="lg:col-span-2">
                <ServiceHealth services={metrics.services} />
              </div>
            </div>

            {/* Request log */}
            <RequestLog requests={metrics.recentRequests} />
          </>
        )}

        {/* Architecture reference */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Gateway Routes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { path: '/api/v1/users', target: ':8081', version: 'v1 + v2', auth: true },
              { path: '/api/v1/products', target: ':8082', version: 'v1 + v2', auth: true },
              { path: '/api/v1/orders', target: ':8083', version: 'v1', auth: true },
              { path: '/api/v1/auth', target: 'gateway', version: 'v1 + v2', auth: false },
            ].map(r => (
              <div key={r.path} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <p className="font-mono text-xs text-brand-400 font-bold truncate">{r.path}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">→</span>
                  <span className="font-mono text-xs text-gray-400">{r.target}</span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  <span className="text-xs bg-gray-700 text-gray-300 rounded px-1.5 py-0.5">{r.version}</span>
                  {r.auth && <span className="text-xs bg-blue-950 text-blue-300 border border-blue-800 rounded px-1.5 py-0.5">JWT</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
