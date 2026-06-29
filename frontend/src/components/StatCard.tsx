import clsx from 'clsx';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  icon: React.ReactNode;
}

const colorMap = {
  blue:   'border-blue-800 bg-blue-950/30',
  green:  'border-green-800 bg-green-950/30',
  yellow: 'border-yellow-800 bg-yellow-950/30',
  red:    'border-red-800 bg-red-950/30',
  purple: 'border-purple-800 bg-purple-950/30',
};

const iconColorMap = {
  blue:   'text-blue-400',
  green:  'text-green-400',
  yellow: 'text-yellow-400',
  red:    'text-red-400',
  purple: 'text-purple-400',
};

export default function StatCard({ label, value, sub, color = 'blue', icon }: Props) {
  return (
    <div className={clsx('border rounded-xl p-5 transition', colorMap[color])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={clsx('mt-0.5', iconColorMap[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
