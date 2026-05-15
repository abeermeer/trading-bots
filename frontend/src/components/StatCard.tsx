import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({ title, value, subtitle, icon: Icon, color = 'emerald', trend }: StatCardProps) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  };

  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-gray-400',
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className={`text-xs ${trend ? trendColors[trend] : 'text-gray-500'}`}>{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg border ${colorMap[color] || colorMap.emerald}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
