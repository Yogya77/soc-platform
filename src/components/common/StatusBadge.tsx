import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'outline' | 'subtle';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'subtle',
  className,
}) => {
  const normalized = status.toUpperCase();

  const getStatusColor = () => {
    switch (normalized) {
      case 'OPEN':
      case 'NEW':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'INVESTIGATING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'ESCALATED':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'CONTAINED':
      case 'RESOLVED':
      case 'CLOSED':
      case 'COMPLETED':
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'DISMISSED':
      case 'DISABLED':
      case 'OFFLINE':
        return 'bg-slate-700/30 text-slate-400 border-slate-600/30';
      case 'MALICIOUS (SIMULATED)':
        return 'bg-red-500/10 text-red-400 border-red-500/30 font-mono-code font-bold';
      case 'SUSPICIOUS':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-mono-code font-bold';
      case 'BENIGN':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-mono-code';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border font-mono-code tracking-wider select-none',
        getStatusColor(),
        className
      )}
    >
      {normalized}
    </span>
  );
};
