'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, Clock, User, X, Compass, ArrowRight, LogOut } from 'lucide-react';
import { ModeToggleBadge } from '@/components/common/ModeToggleBadge';
import { useSecurity } from '@/context/SecurityContext';
import { OmniSearchResult } from '@/types/security';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { cn } from '@/lib/utils';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { searchOmni, user, logout } = useSecurity();
  const [time, setTime] = useState<string>('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OmniSearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Global Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    setSelectedIndex(0);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    const results = await searchOmni(val);
    setSearchResults(results);
  };

  const handleSelectResult = (url: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    router.push(url);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen || searchResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        handleSelectResult(searchResults[selectedIndex].url);
      }
    }
  };

  const getPageMeta = () => {
    if (pathname.startsWith('/dashboard') || pathname === '/') {
      return { title: 'Security Overview Dashboard', section: 'OVERVIEW' };
    }
    if (pathname.startsWith('/alerts')) {
      return { title: 'Alerts & Triage Queue', section: 'MONITORING' };
    }
    if (pathname.startsWith('/incidents')) {
      return { title: 'Incident Command Center', section: 'MONITORING' };
    }
    if (pathname.startsWith('/events')) {
      return { title: 'Windows Security Event Telemetry', section: 'MONITORING' };
    }
    if (pathname.startsWith('/threat-intel')) {
      return { title: 'Threat Intelligence (IOC Explorer)', section: 'INTELLIGENCE' };
    }
    if (pathname.startsWith('/ai-analyst')) {
      return { title: 'AI Analyst Investigation Workbench', section: 'INTELLIGENCE' };
    }
    if (pathname.startsWith('/reports')) {
      return { title: 'Investigation & Incident Reports', section: 'INTELLIGENCE' };
    }
    if (pathname.startsWith('/assets')) {
      return { title: 'Asset Inventory & Risk Register', section: 'ENVIRONMENT' };
    }
    if (pathname.startsWith('/rules')) {
      return { title: 'Detection Rules & SIEM Logic', section: 'ENVIRONMENT' };
    }
    if (pathname.startsWith('/settings')) {
      return { title: 'SOC Configuration & Health', section: 'SYSTEM' };
    }
    return { title: 'SOC Console', section: 'SECURITY' };
  };

  const { title, section } = getPageMeta();

  return (
    <header className="h-14 bg-[#0a0f1d] border-b border-slate-800/80 px-4 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-mono-code">
          <span className="text-slate-400 font-semibold">{section}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-100 font-bold tracking-wide">{title}</span>
        </div>
      </div>

      {/* Center Search Bar with Omni Modal */}
      <div className="relative hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Omni-search alerts, hosts, IPs, rules, routes... (Ctrl+K)"
            className="w-full bg-[#080c14] border border-slate-800 rounded px-3 py-1.5 pl-9 pr-14 text-xs text-slate-200 placeholder-slate-500 font-mono-code focus:outline-none focus:border-blue-500/50"
          />
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X size={13} />
            </button>
          ) : (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono-code bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
              Ctrl+K
            </span>
          )}
        </div>

        {/* Live Search Dropdown */}
        {isSearchOpen && (
          <div
            ref={dropdownRef}
            className="absolute top-10 left-0 right-0 bg-[#0f172a] border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 max-h-96 flex flex-col"
          >
            <div className="px-3 py-2 bg-[#131d33] border-b border-slate-800 flex items-center justify-between text-[11px] font-mono-code text-slate-400">
              <span>{searchResults.length > 0 ? `${searchResults.length} Match(es) Found` : 'Omni Search (All Modules & Routes)'}</span>
              <span className="text-[10px] text-slate-500">↑↓ to navigate • Enter to select • ESC to close</span>
            </div>

            <div className="overflow-y-auto p-1.5 divide-y divide-slate-800/60">
              {searchQuery.trim() === '' ? (
                <div className="p-4 text-center text-xs font-mono-code text-slate-500">
                  Type to search across Alerts, Incidents, Events, Hosts, IOCs, Rules, and Routes (e.g. &quot;/reports&quot;)...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs font-mono-code text-slate-400">
                  No matching SOC records found for <span className="text-slate-200 font-bold">&quot;{searchQuery}&quot;</span>.
                </div>
              ) : (
                searchResults.map((res, idx) => (
                  <div
                    key={`${res.category}-${res.id}-${idx}`}
                    onClick={() => handleSelectResult(res.url)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      'p-2.5 rounded cursor-pointer flex items-center justify-between gap-2 transition-colors font-mono-code group',
                      selectedIndex === idx ? 'bg-[#1a2642] text-blue-300' : 'hover:bg-[#131d33]'
                    )}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span
                        className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0',
                          res.category === 'ALERT' && 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
                          res.category === 'INCIDENT' && 'bg-red-500/15 text-red-400 border border-red-500/30',
                          res.category === 'EVENT' && 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
                          res.category === 'ASSET' && 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
                          res.category === 'IOC' && 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
                          res.category === 'RULE' && 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
                          res.category === 'ROUTE' && 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        )}
                      >
                        {res.category}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-200 truncate group-hover:text-blue-300">
                          {res.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{res.subtitle}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {res.severity && <SeverityBadge severity={res.severity} size="sm" showIcon={false} />}
                      {res.category === 'ROUTE' && <Compass size={13} className="text-cyan-400" />}
                      <ArrowRight size={13} className="text-slate-600 group-hover:text-slate-300" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3.5">
        {/* UTC Live Clock */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono-code text-slate-400 bg-[#080c14] px-2.5 py-1 rounded border border-slate-800">
          <Clock size={12} className="text-slate-500" />
          <span>{time || 'Loading Clock...'}</span>
        </div>

        {/* Mode Toggle Badge */}
        <ModeToggleBadge />

        {/* Notification Bell */}
        <button
          className="relative p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Active SOC Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        </button>

        {/* Analyst Profile & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-7 h-7 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <User size={14} />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-mono-code font-semibold text-slate-200 leading-tight">
              {user?.name ?? '—'}
            </span>
            <span className="text-[10px] font-mono-code text-slate-500 leading-tight">
              {user?.role ?? 'Unauthenticated'}
            </span>
          </div>
          {/* Logout */}
          <button
            onClick={async () => { await logout(); router.push('/'); }}
            title="Sign out"
            className="ml-1 p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};
