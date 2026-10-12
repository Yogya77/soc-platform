'use client';

import React, { useEffect, useState } from 'react';
import { getActiveServiceMode, setSecurityServiceMode } from '@/services';
import { Database, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ModeToggleBadge: React.FC<{ className?: string }> = ({ className }) => {
  const [mode, setMode] = useState<'MOCK_DEMO' | 'REAL_FASTAPI'>('MOCK_DEMO');

  useEffect(() => {
    setMode(getActiveServiceMode());
  }, []);

  const toggleMode = () => {
    const nextMode = mode === 'MOCK_DEMO' ? 'REAL_FASTAPI' : 'MOCK_DEMO';
    setSecurityServiceMode(nextMode);
    setMode(nextMode);
    window.location.reload();
  };

  const isMock = mode === 'MOCK_DEMO';

  return (
    <button
      onClick={toggleMode}
      title="Click to toggle between Demo (Simulated) and Real API Mode"
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono-code font-semibold border transition-all select-none',
        isMock
          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
        className
      )}
    >
      {isMock ? (
        <>
          <Database size={11} className="text-amber-400" />
          <span>DEMO MODE (Simulated)</span>
        </>
      ) : (
        <>
          <Radio size={11} className="text-emerald-400 animate-pulse" />
          <span>LIVE API (FastAPI)</span>
        </>
      )}
    </button>
  );
};
