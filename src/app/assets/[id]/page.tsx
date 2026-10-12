'use client';

import React, { useEffect, useState, use } from 'react';
import { useSecurity } from '@/context/SecurityContext';
import { Asset } from '@/types/security';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  Server,
  ShieldAlert,
  AlertTriangle,
  WifiOff,
  Wifi,
  Binary,
  Fingerprint,
  User,
  Activity,
  Check,
} from 'lucide-react';
import Link from 'next/link';

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { assets, alerts, events, threatIntel, isolateAsset } = useSecurity();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const found = assets.find((a) => a.id === resolvedParams.id || a.hostname.toLowerCase() === resolvedParams.id.toLowerCase());
    if (found) {
      setAsset(found);
    }
  }, [assets, resolvedParams.id]);

  const handleToggleIsolation = async () => {
    if (!asset) return;
    const nextState = asset.isolationStatus !== 'ISOLATED';
    await isolateAsset(asset.id, nextState);
    setFeedback(nextState ? `Host ${asset.hostname} quarantined from network.` : `Quarantine released for ${asset.hostname}.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  if (!asset) {
    return (
      <div className="p-8 text-center text-xs font-mono-code text-slate-400">
        Asset {resolvedParams.id} not found.{' '}
        <Link href="/assets" className="text-blue-400 underline">
          Back to Assets
        </Link>
      </div>
    );
  }

  const hostAlerts = alerts.filter((a) => a.assetId === asset.id || a.hostname === asset.hostname);
  const hostEvents = events.filter((e) => e.hostname === asset.hostname);
  const hostIocs = threatIntel.filter((i) => i.associatedHostnames.includes(asset.hostname));

  return (
    <div className="space-y-5">
      {/* Header & Feedback */}
      <div className="flex items-center justify-between">
        <Link href="/assets" className="inline-flex items-center gap-1.5 text-xs font-mono-code text-slate-400 hover:text-slate-200">
          <ArrowLeft size={14} />
          <span>Back to Asset Inventory</span>
        </Link>
        {feedback && (
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono-code animate-in fade-in">
            <Check size={14} />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* Asset Overview Card */}
      <div className="bg-[#0f172a] border border-slate-800/80 rounded p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Server size={18} className="text-blue-400" />
              <h1 className="text-base font-mono-code font-bold text-slate-100">{asset.hostname}</h1>
              <SeverityBadge severity={asset.health} size="sm" />
            </div>
            <div className="text-xs font-mono-code text-slate-400">
              Asset ID: <span className="text-slate-200 font-bold">{asset.id}</span> | Department:{' '}
              <span className="text-slate-200 font-semibold">{asset.department || 'N/A'}</span> | Assigned User:{' '}
              <span className="text-slate-200">{asset.assignedUser || 'Unassigned'}</span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleToggleIsolation}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-code font-semibold transition-colors ${
                asset.isolationStatus === 'ISOLATED'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30'
                  : 'bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30'
              }`}
            >
              {asset.isolationStatus === 'ISOLATED' ? (
                <>
                  <Wifi size={13} />
                  <span>Release Quarantine</span>
                </>
              ) : (
                <>
                  <WifiOff size={13} />
                  <span>Network Quarantine Host</span>
                </>
              )}
            </button>
            <Link
              href="/incidents/INC-2026-0421"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono-code font-semibold transition-colors"
            >
              <AlertTriangle size={13} className="text-amber-400" />
              <span>Related Incident</span>
            </Link>
          </div>
        </div>

        {/* Telemetry Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono-code">
          <div className="p-3 bg-[#080c14] rounded border border-slate-800">
            <span className="text-slate-500">IP Address:</span>
            <div className="text-slate-200 font-bold text-sm mt-0.5">{asset.ipAddress}</div>
          </div>
          <div className="p-3 bg-[#080c14] rounded border border-slate-800">
            <span className="text-slate-500">MAC Address:</span>
            <div className="text-slate-200 font-bold text-sm mt-0.5">{asset.macAddress}</div>
          </div>
          <div className="p-3 bg-[#080c14] rounded border border-slate-800">
            <span className="text-slate-500">Calculated Risk Score:</span>
            <div className="text-red-400 font-bold text-sm mt-0.5">{asset.riskScore}/100</div>
          </div>
          <div className="p-3 bg-[#080c14] rounded border border-slate-800">
            <span className="text-slate-500">Quarantine Status:</span>
            <div className={asset.isolationStatus === 'ISOLATED' ? 'text-red-400 font-bold text-sm mt-0.5' : 'text-emerald-400 font-bold text-sm mt-0.5'}>
              {asset.isolationStatus}
            </div>
          </div>
        </div>

        {/* Linked Alerts on Host */}
        <div className="p-4 bg-[#080c14] rounded border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-mono-code font-bold uppercase tracking-wider text-slate-200">
              <ShieldAlert size={14} className="text-orange-400" />
              <span>Active Alerts on {asset.hostname} ({hostAlerts.length})</span>
            </div>
          </div>

          <div className="space-y-2 font-mono-code text-xs">
            {hostAlerts.length > 0 ? (
              hostAlerts.map((alt) => (
                <div
                  key={alt.id}
                  className="p-2.5 bg-[#0f172a] border border-slate-800 rounded flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={alt.severity} size="sm" />
                    <Link href={`/alerts/${alt.id}`} className="font-bold text-slate-200 hover:text-blue-400">
                      {alt.title}
                    </Link>
                  </div>
                  <Link
                    href={`/alerts/${alt.id}`}
                    className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[11px] font-bold"
                  >
                    Triage
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-xs py-2">No active alerts currently pending on this host.</div>
            )}
          </div>
        </div>

        {/* Windows Events Stream on Host */}
        <div className="p-4 bg-[#080c14] rounded border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-mono-code font-bold uppercase tracking-wider text-slate-200">
              <Binary size={14} className="text-blue-400" />
              <span>Correlated Windows Telemetry ({hostEvents.length} Events)</span>
            </div>
            <Link href="/events" className="text-blue-400 text-xs font-mono-code hover:underline">
              Inspect in Event Viewer
            </Link>
          </div>

          <div className="space-y-2 font-mono-code text-xs">
            {hostEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-2.5 bg-[#0f172a] border border-slate-800 rounded flex items-center justify-between gap-2"
              >
                <div>
                  <div className="font-bold text-slate-200">
                    Event {evt.eventId} ({evt.id}): {evt.eventName}
                  </div>
                  <div className="text-[11px] text-slate-400">{evt.processCommandLine || evt.processName || '-'}</div>
                </div>
                <span className="text-[11px] text-slate-500">{formatDate(evt.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Correlated IOCs on Host */}
        {hostIocs.length > 0 && (
          <div className="p-4 bg-[#080c14] rounded border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono-code font-bold uppercase tracking-wider text-purple-400">
              <Fingerprint size={14} />
              <span>Correlated Threat Indicators</span>
            </div>
            <div className="space-y-1.5 font-mono-code text-xs">
              {hostIocs.map((ioc) => (
                <div key={ioc.id} className="p-2 bg-[#0f172a] rounded border border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-slate-200">{ioc.indicator}</span>
                  <span className="text-[10px] text-slate-400">{ioc.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
