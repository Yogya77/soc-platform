'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SecurityProvider } from '@/context/SecurityContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <SecurityProvider>
      <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-row antialiased">
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-[#080c14]">
            {children}
          </main>
        </div>
      </div>
    </SecurityProvider>
  );
};
