import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MetricEntry } from '../types';

interface Props {
  requests: MetricEntry[];
}

function buildChartData(requests: MetricEntry[]) {
  const buckets: Record<string, { time: string; avg: number; count: number; total: number }> = {};

  requests.forEach(r => {
    const t = new Date(r.timestamp);
    const key = `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}`;
    if (!buckets[key]) buckets[key] = { time: key, avg: 0, count: 0, total: 0 };
    buckets[key].total += r.durationMs;
    buckets[key].count += 1;
    buckets[key].avg = Math.round(buckets[key].total / buckets[key].count);
  });

  return Object.values(buckets).slice(-15);
}

export default function LatencyChart({ requests }: Props) {
  const data = buildChartData(requests);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Avg Latency (ms) — last 15 min buckets
      </h2>
      {data.length < 2 ? (
        <div className="h-40 flex items-center justify-center text-gray-600 text-xs">
          Collecting data…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f6ef7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 8 }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: '#4f6ef7' }}
              formatter={(v: number) => [`${v}ms`, 'avg latency']}
            />
            <Area type="monotone" dataKey="avg" stroke="#4f6ef7" strokeWidth={2} fill="url(#latGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
