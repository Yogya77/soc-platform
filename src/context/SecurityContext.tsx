'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSecurityService } from '@/services';
import {
  Alert,
  AlertStatus,
  Incident,
  IncidentStatus,
  Asset,
  AIInvestigationResult,
  InvestigationReport,
  SOCDashboardStats,
  AnalystAuditLog,
  RecommendationStatus,
  OmniSearchResult,
} from '@/types/security';
import { WindowsSecurityEvent } from '@/types/events';
import { DetectionRule } from '@/types/rules';
import { ThreatIndicator } from '@/types/threatIntel';

interface SecurityContextType {
  stats: SOCDashboardStats | null;
  alerts: Alert[];
  incidents: Incident[];
  events: WindowsSecurityEvent[];
  assets: Asset[];
  rules: DetectionRule[];
  threatIntel: ThreatIndicator[];
  auditLogs: AnalystAuditLog[];
  loading: boolean;
  activeIncidentId: string;
  setActiveIncidentId: (id: string) => void;
  
  refreshAll: () => Promise<void>;
  updateAlertStatus: (id: string, status: AlertStatus, note?: string) => Promise<void>;
  escalateAlert: (alertId: string, payload?: import('@/types/security').CreateIncidentPayload | string) => Promise<Incident>;
  linkAlertToIncident: (alertId: string, incidentId: string) => Promise<void>;
  
  updateIncidentStatus: (id: string, status: IncidentStatus) => Promise<void>;
  updateIncidentSeverity: (id: string, severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') => Promise<void>;
  assignAnalyst: (id: string, analyst: string) => Promise<void>;
  addIncidentNote: (incidentId: string, author: string, content: string) => Promise<void>;
  
  isolateAsset: (id: string, isolate: boolean) => Promise<void>;
  toggleRule: (id: string, enabled: boolean) => Promise<void>;
  testRule: (id: string) => Promise<{ matched: boolean; sampleEvent: string; message: string }>;
  
  runAIInvestigation: (incidentId: string, onStepUpdate?: (step: number) => void) => Promise<AIInvestigationResult>;
  updateRecommendation: (incidentId: string, recId: string, status: RecommendationStatus) => Promise<void>;
  generateReport: (incidentId: string) => Promise<InvestigationReport>;
  
  searchOmni: (query: string) => Promise<OmniSearchResult[]>;
  addAuditLog: (entry: Omit<AnalystAuditLog, 'id' | 'timestamp'>) => Promise<void>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<SOCDashboardStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [events, setEvents] = useState<WindowsSecurityEvent[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [threatIntel, setThreatIntel] = useState<ThreatIndicator[]>([]);
  const [auditLogs, setAuditLogs] = useState<AnalystAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIncidentId, setActiveIncidentId] = useState<string>('INC-2026-0421');

  const refreshAll = useCallback(async () => {
    try {
      const service = getSecurityService();
      const [
        dashStats,
        alertsData,
        incidentsData,
        eventsData,
        assetsData,
        rulesData,
        threatData,
        logsData,
      ] = await Promise.all([
        service.getDashboardStats(),
        service.getAlerts(),
        service.getIncidents(),
        service.getEvents(),
        service.getAssets(),
        service.getDetectionRules(),
        service.getThreatIntel(),
        service.getAuditLogs(),
      ]);

      setStats(dashStats);
      setAlerts(alertsData);
      setIncidents(incidentsData);
      setEvents(eventsData);
      setAssets(assetsData);
      setRules(rulesData);
      setThreatIntel(threatData);
      setAuditLogs(logsData);
    } catch (err) {
      console.error('Failed to load SOC telemetry state:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
    // Deterministic heartbeat sync clock every 15 seconds
    const interval = setInterval(() => {
      const service = getSecurityService();
      service.getDashboardStats().then((s) => setStats(s)).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  const updateAlertStatus = async (id: string, status: AlertStatus, note?: string) => {
    const service = getSecurityService();
    await service.updateAlertStatus(id, status, note);
    await refreshAll();
  };

  const escalateAlert = async (alertId: string, payload?: import('@/types/security').CreateIncidentPayload | string): Promise<Incident> => {
    const service = getSecurityService();
    const newInc = await service.escalateAlertToIncident(alertId, payload);
    await refreshAll();
    return newInc;
  };

  const linkAlertToIncident = async (alertId: string, incidentId: string) => {
    const service = getSecurityService();
    await service.linkAlertToIncident(alertId, incidentId);
    await refreshAll();
  };

  const updateIncidentStatus = async (id: string, status: IncidentStatus) => {
    const service = getSecurityService();
    await service.updateIncidentStatus(id, status);
    await refreshAll();
  };

  const updateIncidentSeverity = async (id: string, severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') => {
    const service = getSecurityService();
    await service.updateIncidentSeverity(id, severity);
    await refreshAll();
  };

  const assignAnalyst = async (id: string, analyst: string) => {
    const service = getSecurityService();
    await service.assignIncidentAnalyst(id, analyst);
    await refreshAll();
  };

  const addIncidentNote = async (incidentId: string, author: string, content: string) => {
    const service = getSecurityService();
    await service.addIncidentNote(incidentId, author, content);
    await refreshAll();
  };

  const isolateAsset = async (id: string, isolate: boolean) => {
    const service = getSecurityService();
    await service.isolateAsset(id, isolate);
    await refreshAll();
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    const service = getSecurityService();
    await service.toggleRuleStatus(id, enabled);
    await refreshAll();
  };

  const testRule = async (id: string) => {
    const service = getSecurityService();
    const res = await service.testDetectionRule(id);
    await refreshAll();
    return res;
  };

  const runAIInvestigation = async (
    incidentId: string,
    onStepUpdate?: (step: number) => void
  ): Promise<AIInvestigationResult> => {
    const service = getSecurityService();
    const res = await service.startAIInvestigation(incidentId, onStepUpdate);
    await refreshAll();
    return res;
  };

  const updateRecommendation = async (incidentId: string, recId: string, status: RecommendationStatus) => {
    const service = getSecurityService();
    await service.updateRecommendationStatus(incidentId, recId, status);
    await refreshAll();
  };

  const generateReport = async (incidentId: string): Promise<InvestigationReport> => {
    const service = getSecurityService();
    const rep = await service.generateInvestigationReport(incidentId);
    await refreshAll();
    return rep;
  };

  const searchOmni = async (query: string): Promise<OmniSearchResult[]> => {
    const service = getSecurityService();
    return service.searchOmni(query);
  };

  const addAuditLog = async (entry: Omit<AnalystAuditLog, 'id' | 'timestamp'>) => {
    const service = getSecurityService();
    await service.addAuditLog(entry);
    const logs = await service.getAuditLogs();
    setAuditLogs(logs);
  };

  return (
    <SecurityContext.Provider
      value={{
        stats,
        alerts,
        incidents,
        events,
        assets,
        rules,
        threatIntel,
        auditLogs,
        loading,
        activeIncidentId,
        setActiveIncidentId,
        refreshAll,
        updateAlertStatus,
        escalateAlert,
        linkAlertToIncident,
        updateIncidentStatus,
        updateIncidentSeverity,
        assignAnalyst,
        addIncidentNote,
        isolateAsset,
        toggleRule,
        testRule,
        runAIInvestigation,
        updateRecommendation,
        generateReport,
        searchOmni,
        addAuditLog,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
