import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JsonViewerProps {
  data: Record<string, any> | string;
  title?: string;
  className?: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  title = 'Raw Windows Event Telemetry (JSON/XML)',
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const formatted = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('bg-[#080c14] rounded border border-slate-800 overflow-hidden', className)}>
      <div className="flex items-center justify-between px-3 py-2 bg-[#131d33] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-blue-400" />
          <span className="text-xs font-mono-code font-semibold text-slate-300 tracking-wider">
            {title}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] font-mono-code text-slate-400 hover:text-slate-200 transition-colors"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 text-[11px] font-mono-code text-emerald-400/90 overflow-x-auto max-h-80 leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        <code>{formatted}</code>
      </pre>
    </div>
  );
};
