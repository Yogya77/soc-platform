import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ rows = 4, className }) => {
  return (
    <div className={cn('w-full space-y-2 p-4 bg-[#0f172a] rounded border border-slate-800/80 animate-pulse', className)}>
      <div className="h-4 bg-slate-800 rounded w-1/4 mb-4" />
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="flex items-center space-x-3">
          <div className="h-3.5 bg-slate-800/80 rounded w-1/6" />
          <div className="h-3.5 bg-slate-800/60 rounded flex-1" />
          <div className="h-3.5 bg-slate-800/80 rounded w-1/5" />
          <div className="h-3.5 bg-slate-800/40 rounded w-1/12" />
        </div>
      ))}
    </div>
  );
};
