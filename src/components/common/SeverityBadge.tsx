import React from 'react';
import { AlertSeverity, AssetHealth } from '@/types/security';
import { cn } from '@/lib/utils';
import { AlertOctagon, AlertTriangle, AlertCircle, Info, CheckCircle2, ShieldOff } from 'lucide-react';

interface SeverityBadgeProps {
  severity: AlertSeverity | AssetHealth | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | 'HEALTHY' | 'WARNING' | 'OFFLINE';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'md',
  showIcon = true,
  className,
}) => {
  const normalized = (severity || 'INFO').toUpperCase();

  const getStyle = () => {
    switch (normalized) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-500/10 text-red-400 border-red-500/30',
          icon: AlertOctagon,
        };
      case 'HIGH':
      case 'WARNING':
        return {
          bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
          icon: AlertTriangle,
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
          icon: AlertCircle,
        };
      case 'LOW':
        return {
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          icon: Info,
        };
      case 'OFFLINE':
        return {
          bg: 'bg-slate-700/30 text-slate-400 border-slate-600/30',
          icon: ShieldOff,
        };
      case 'HEALTHY':
      case 'INFO':
      default:
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: CheckCircle2,
        };
    }
  };

  const { bg, icon: IconComponent } = getStyle();

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1 font-mono-code font-semibold uppercase tracking-wider',
    md: 'text-xs px-2 py-0.5 gap-1.5 font-mono-code font-semibold uppercase tracking-wider',
    lg: 'text-sm px-2.5 py-1 gap-2 font-mono-code font-bold uppercase tracking-wider',
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded border transition-colors select-none',
        bg,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <IconComponent size={iconSizes[size]} className="shrink-0" />}
      <span>{normalized}</span>
    </span>
  );
};
