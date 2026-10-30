import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  colorScheme?: 'blue' | 'emerald' | 'rose' | 'amber' | 'slate';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive,
  colorScheme = 'blue',
}) => {
  const schemeClasses = {
    blue: {
      bg: 'bg-blue-50 text-blue-700 border-blue-100',
      iconBg: 'bg-blue-600 text-white',
      borderTop: 'border-t-blue-500',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      iconBg: 'bg-emerald-600 text-white',
      borderTop: 'border-t-emerald-500',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-700 border-rose-100',
      iconBg: 'bg-rose-600 text-white',
      borderTop: 'border-t-rose-500',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-700 border-amber-100',
      iconBg: 'bg-amber-600 text-white',
      borderTop: 'border-t-amber-500',
    },
    slate: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      iconBg: 'bg-slate-700 text-white',
      borderTop: 'border-t-slate-600',
    },
  }[colorScheme];

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs transition hover:shadow-md border-t-4 ${schemeClasses.borderTop}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shadow-xs ${schemeClasses.iconBg}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">{value}</span>
        {trend && (
          <span
            className={`text-xs font-semibold ${
              trendPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
};

