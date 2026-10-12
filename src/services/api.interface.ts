import {
  Alert,
  AlertStatus,
  Incident,
  IncidentStatus,
  Asset,
  AIInvestigationResult,
  InvestigationReport,
  SOCDashboardStats,
  SystemHealth,
  AnalystAuditLog,
  RecommendationStatus,
  OmniSearchResult,
} from '@/types/security';
import { WindowsSecurityEvent } from '@/types/events';
import { DetectionRule } from '@/types/rules';
import { ThreatIndicator } from '@/types/threatIntel';

export interface AlertFilterOptions {
  severity?: string;
  status?: string;
  search?: string;
  assetId?: string;
  ruleId?: string;
}

export interface IncidentFilterOptions {
  severity?: string;
  status?: string;
  search?: string;
  assignedAnalyst?: string;
}

export interface EventFilterOptions {
  eventId?: number;
  hostname?: string;
  username?: string;
  search?: string;
  severity?: string;
  limit?: number;
}

export interface ISecurityService {
  getDashboardStats(): Promise<SOCDashboardStats>;
  getActivityTimeSeries(): Promise<Array<{ timestamp: string; events: number; alerts: number }>>;
  
  getAlerts(filters?: AlertFilterOptions): Promise<Alert[]>;
  getAlertById(id: string): Promise<Alert | null>;
  updateAlertStatus(id: string, status: AlertStatus, note?: string): Promise<Alert>;
  escalateAlertToIncident(alertId: string, payload?: import('@/types/security').CreateIncidentPayload | string): Promise<Incident>;
  linkAlertToIncident(alertId: string, incidentId: string): Promise<Incident>;
  
  getIncidents(filters?: IncidentFilterOptions): Promise<Incident[]>;
  getIncidentById(id: string): Promise<Incident | null>;
  updateIncidentStatus(id: string, status: IncidentStatus): Promise<Incident>;
  updateIncidentSeverity(id: string, severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'): Promise<Incident>;
  assignIncidentAnalyst(id: string, analyst: string): Promise<Incident>;
  addIncidentNote(incidentId: string, author: string, content: string): Promise<Incident>;
  
  getEvents(filters?: EventFilterOptions): Promise<WindowsSecurityEvent[]>;
  getEventById(id: string): Promise<WindowsSecurityEvent | null>;
  
  getAssets(): Promise<Asset[]>;
  getAssetById(id: string): Promise<Asset | null>;
  isolateAsset(id: string, isolate: boolean): Promise<Asset>;
  
  getDetectionRules(): Promise<DetectionRule[]>;
  getDetectionRuleById(id: string): Promise<DetectionRule | null>;
  toggleRuleStatus(id: string, enabled: boolean): Promise<DetectionRule>;
  testDetectionRule(ruleId: string): Promise<{ matched: boolean; sampleEvent: string; message: string }>;
  
  getThreatIntel(): Promise<ThreatIndicator[]>;
  getThreatIndicatorByValue(value: string): Promise<ThreatIndicator | null>;
  
  startAIInvestigation(incidentId: string, onStepUpdate?: (stepIndex: number) => void): Promise<AIInvestigationResult>;
  getAIInvestigation(incidentId: string): Promise<AIInvestigationResult | null>;
  updateRecommendationStatus(incidentId: string, recId: string, status: RecommendationStatus): Promise<AIInvestigationResult>;
  
  getInvestigationReport(incidentId: string): Promise<InvestigationReport | null>;
  generateInvestigationReport(incidentId: string): Promise<InvestigationReport>;
  
  getAuditLogs(): Promise<AnalystAuditLog[]>;
  addAuditLog(entry: Omit<AnalystAuditLog, 'id' | 'timestamp'>): Promise<AnalystAuditLog>;
  
  searchOmni(query: string): Promise<OmniSearchResult[]>;
  
  getSystemHealth(): Promise<SystemHealth>;
  setMode(mode: 'MOCK_DEMO' | 'REAL_FASTAPI'): Promise<void>;
  getCurrentMode(): 'MOCK_DEMO' | 'REAL_FASTAPI';
}
