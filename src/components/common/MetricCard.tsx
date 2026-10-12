import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  icon?: LucideIcon;
  severityColor?: 'critical' | 'high' | 'medium' | 'low' | 'healthy' | 'neutral';
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  severityColor = 'neutral',
  onClick,
  className,
}) => {
  const getBorderAccent = () => {
    switch (severityColor) {
      case 'critical':
        return 'border-l-4 border-l-red-500 hover:border-red-500/50';
      case 'high':
        return 'border-l-4 border-l-orange-500 hover:border-orange-500/50';
      case 'medium':
        return 'border-l-4 border-l-yellow-500 hover:border-yellow-500/50';
      case 'low':
        return 'border-l-4 border-l-blue-500 hover:border-blue-500/50';
      case 'healthy':
        return 'border-l-4 border-l-emerald-500 hover:border-emerald-500/50';
      default:
        return 'border-l-4 border-l-slate-700 hover:border-slate-600';
    }
  };

  const getValueColor = () => {
    switch (severityColor) {
      case 'critical':
        return 'text-red-400';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-blue-400';
      case 'healthy':
        return 'text-emerald-400';
      default:
        return 'text-slate-100';
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[#0f172a] rounded border border-slate-800/80 p-4 transition-all duration-150',
        getBorderAccent(),
        onClick && 'cursor-pointer hover:bg-[#131d33]',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono-code font-medium uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {Icon && <Icon className="text-slate-500" size={16} />}
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <div className={cn('text-2xl font-bold font-mono-code tracking-tight', getValueColor())}>
          {value}
        </div>
        {trend && (
          <span
            className={cn(
              'text-xs font-mono-code font-semibold px-1.5 py-0.5 rounded',
              trend.isPositive
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="mt-1 text-[11px] text-slate-500 font-medium truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
};
