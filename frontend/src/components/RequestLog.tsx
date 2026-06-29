import clsx from 'clsx';
import { MetricEntry } from '../types';

interface Props {
  requests: MetricEntry[];
}

const methodColors: Record<string, string> = {
  GET:    'bg-blue-950 text-blue-300 border-blue-800',
  POST:   'bg-green-950 text-green-300 border-green-800',
  PUT:    'bg-yellow-950 text-yellow-300 border-yellow-800',
  PATCH:  'bg-orange-950 text-orange-300 border-orange-800',
  DELETE: 'bg-red-950 text-red-300 border-red-800',
};

function statusColor(code: number): string {
  if (code >= 500) return 'text-red-400';
  if (code >= 400) return 'text-yellow-400';
  if (code >= 300) return 'text-blue-400';
  return 'text-green-400';
}

export default function RequestLog({ requests }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Recent Requests
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
              <th className="text-left pb-3 pr-4">Method</th>
              <th className="text-left pb-3 pr-4">Path</th>
              <th className="text-left pb-3 pr-4">Status</th>
              <th className="text-left pb-3 pr-4">Latency</th>
              <th className="text-left pb-3 pr-4">Service</th>
              <th className="text-left pb-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-600 text-xs">
                  No requests yet. Make some API calls to see them here.
                </td>
              </tr>
            ) : (
              requests.map((r, i) => (
                <tr key={i} className={clsx('hover:bg-gray-800/30 transition', r.rateLimited && 'opacity-60')}>
                  <td className="py-2.5 pr-4">
                    <span className={clsx('font-mono text-xs font-bold border px-1.5 py-0.5 rounded', methodColors[r.method] ?? 'bg-gray-800 text-gray-300 border-gray-700')}>
                      {r.method}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="font-mono text-xs text-gray-300 truncate max-w-[180px] block">{r.path}</span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className={clsx('font-mono text-xs font-bold', statusColor(r.statusCode))}>
                      {r.statusCode}
                      {r.rateLimited && <span className="ml-1 text-orange-400">⚡</span>}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className={clsx('font-mono text-xs', r.durationMs > 500 ? 'text-yellow-400' : 'text-gray-400')}>
                      {r.durationMs}ms
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="text-xs text-gray-500">{r.service}</span>
                  </td>
                  <td className="py-2.5">
                    <span className="font-mono text-xs text-gray-600">
                      {new Date(r.timestamp).toLocaleTimeString()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
