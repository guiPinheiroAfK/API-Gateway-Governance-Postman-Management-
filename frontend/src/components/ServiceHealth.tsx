import clsx from 'clsx';
import { ServiceHealth as SH } from '../types';

interface Props {
  services: SH[];
}

const statusStyles = {
  healthy:  { dot: 'bg-green-400', badge: 'bg-green-950 text-green-400 border-green-800' },
  degraded: { dot: 'bg-yellow-400 animate-pulse', badge: 'bg-yellow-950 text-yellow-400 border-yellow-800' },
  down:     { dot: 'bg-red-500 animate-pulse', badge: 'bg-red-950 text-red-400 border-red-800' },
};

const serviceIcons: Record<string, string> = {
  'users-service':    '👤',
  'products-service': '📦',
  'orders-service':   '🛒',
};

export default function ServiceHealth({ services }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Downstream Services
      </h2>
      <div className="space-y-3">
        {services.map(s => {
          const styles = statusStyles[s.status];
          return (
            <div key={s.name} className="flex items-center justify-between py-2.5 px-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">{serviceIcons[s.name] ?? '🔌'}</span>
                <div>
                  <p className="text-sm font-medium text-white">{s.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{s.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 font-mono">{s.latencyMs}ms</span>
                <div className={clsx('flex items-center gap-1.5 border text-xs px-2.5 py-1 rounded-full font-medium', styles.badge)}>
                  <span className={clsx('w-1.5 h-1.5 rounded-full', styles.dot)} />
                  {s.status}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
