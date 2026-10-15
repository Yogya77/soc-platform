'use client';

import React, { useState } from 'react';
import { useSecurity } from '@/context/SecurityContext';
import { Shield, Lock, Mail, Key, AlertTriangle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LoginForm: React.FC = () => {
  const { login } = useSecurity();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        setErrorMessage(result.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-lg shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Terminal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 mb-2">
            <Shield size={28} />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-live-pulse" />
            <span className="text-[11px] font-mono-code font-bold uppercase tracking-widest text-slate-400">
              SOC GATEWAY // ANALYST ACCESS
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-100 font-mono-code tracking-wide">
            SOC Operations Terminal
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please authenticate to access real-time telemetry, alert queues, and incident response command.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono-code animate-in fade-in duration-200">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-mono-code">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Mail size={13} className="text-slate-500" />
              <span>Analyst Email</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analyst@soc.internal"
              disabled={isSubmitting}
              autoComplete="username"
              required
              className="w-full bg-[#080c14] border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Key size={13} className="text-slate-500" />
              <span>Analyst Password</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={isSubmitting}
              autoComplete="current-password"
              required
              className="w-full bg-[#080c14] border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider uppercase transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <Lock size={14} />
                <span>Authenticate Session</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Reference Accounts Note */}
        <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono-code text-slate-500 space-y-1.5">
          <div className="font-semibold text-slate-400">Configured Analyst Accounts:</div>
          <div className="flex justify-between">
            <span>sarah.jenkins@soc.internal</span>
            <span className="text-slate-400">Lead IR Analyst</span>
          </div>
          <div className="flex justify-between">
            <span>marcus.vance@soc.internal</span>
            <span className="text-slate-400">Tier 2 Analyst</span>
          </div>
          <div className="flex justify-between">
            <span>admin@soc.internal</span>
            <span className="text-slate-400">SOC Administrator</span>
          </div>
          <div className="flex justify-between">
            <span>auditor@soc.internal</span>
            <span className="text-slate-400">Compliance Auditor</span>
          </div>
        </div>
      </div>
    </div>
  );
};
