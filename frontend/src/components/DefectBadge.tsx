import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { InspectionResultStatus, DefectSeverity } from '../types';

interface ResultBadgeProps {
  status: InspectionResultStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const ResultBadge: React.FC<ResultBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm font-semibold',
    lg: 'px-4 py-1.5 text-base font-bold tracking-wide',
  };

  const iconSizes = {
    sm: 13,
    md: 16,
    lg: 20,
  };

  if (status === 'PASS') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ${sizeClasses[size]}`}
      >
        {showIcon && <CheckCircle2 size={iconSizes[size]} className="text-emerald-600" />}
        PASS
      </span>
    );
  }

  if (status === 'FAIL') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 ${sizeClasses[size]}`}
      >
        {showIcon && <XCircle size={iconSizes[size]} className="text-rose-600" />}
        FAIL
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 ${sizeClasses[size]}`}
    >
      {showIcon && <AlertTriangle size={iconSizes[size]} className="text-amber-600" />}
      REVIEW REQUIRED
    </span>
  );
};

interface SeverityBadgeProps {
  severity: DefectSeverity;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  if (severity === 'CRITICAL') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">
        <ShieldAlert size={12} />
        CRITICAL
      </span>
    );
  }
  if (severity === 'MEDIUM') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
        MEDIUM
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
      LOW
    </span>
  );
};

export const CategoryTag: React.FC<{ category: string }> = ({ category }) => {
  const getCatStyle = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'scratch':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'crack':
        return 'bg-red-50 text-red-700 border-red-200 font-semibold';
      case 'dent':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'corrosion':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'missing material':
        return 'bg-purple-50 text-purple-700 border-purple-200 font-semibold';
      case 'discolouration':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'surface damage':
        return 'bg-stone-100 text-stone-700 border-stone-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${getCatStyle(category)}`}>
      {category}
    </span>
  );
};

