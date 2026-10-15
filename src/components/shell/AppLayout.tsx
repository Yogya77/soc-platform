'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SecurityProvider, useSecurity } from '@/context/SecurityContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { getActiveServiceMode } from '@/services';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * AuthGate is rendered *inside* SecurityProvider so it can call useSecurity().
 * In MOCK_DEMO mode: no login required — shows the full shell immediately.
 * In REAL_FASTAPI mode: shows LoginForm until a valid session is verified.
 */
const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, authLoading } = useSecurity();
  const mode = getActiveServiceMode();

  // Mock/demo mode — bypass auth entirely, show full shell
  if (mode !== 'REAL_FASTAPI') {
    return (
      <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-row antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-[#080c14]">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Live API mode — session check in progress
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400 font-mono-code text-sm">
          <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  // Live API mode — not authenticated, show login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080c14] text-slate-100 antialiased">
        <LoginForm />
      </div>
    );
  }

  // Live API mode — authenticated, show full shell
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-row antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-[#080c14]">
          {children}
        </main>
      </div>
    </div>
  );
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <SecurityProvider>
      <AuthGate>{children}</AuthGate>
    </SecurityProvider>
  );
};
