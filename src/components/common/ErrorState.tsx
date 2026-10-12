import React from 'react';
import { AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { setSecurityServiceMode } from '@/services';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showModeSwitch?: boolean;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'SOC BACKEND UNAVAILABLE',
  message = 'Unable to establish telemetry connection to the security backend service (FastAPI/PostgreSQL).',
  onRetry,
  showModeSwitch = true,
  className,
}) => {
  const handleSwitchToMock = () => {
    setSecurityServiceMode('MOCK_DEMO');
    window.location.reload();
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 bg-[#0f172a] rounded border border-red-500/30 text-center my-4',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-3">
        <AlertTriangle size={24} />
      </div>
      <h3 className="text-base font-bold text-red-400 tracking-wide font-mono-code">{title}</h3>
      <p className="text-xs text-slate-400 max-w-md mt-1 mb-5 leading-relaxed">{message}</p>

      <div className="flex items-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono-code transition-colors"
          >
            <RefreshCw size={13} />
            <span>Retry Connection</span>
          </button>
        )}
        {showModeSwitch && (
          <button
            onClick={handleSwitchToMock}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-mono-code transition-colors"
          >
            <Database size={13} />
            <span>Switch to Demo Mode (Simulated)</span>
          </button>
        )}
      </div>
    </div>
  );
};
