import { ISecurityService, AlertFilterOptions, IncidentFilterOptions, EventFilterOptions } from './api.interface';
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

export class HttpSecurityService implements ISecurityService {
  private baseUrl: string;
  private mode: 'MOCK_DEMO' | 'REAL_FASTAPI' = 'REAL_FASTAPI';

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      }
      return (await res.json()) as T;
    } catch (err: any) {
      throw new Error(`SOC Backend Service Error: ${err.message || 'Network request failed'}`);
    }
  }

  async getDashboardStats(): Promise<SOCDashboardStats> {
    return this.request<SOCDashboardStats>('/dashboard/stats');
  }

  async getActivityTimeSeries(): Promise<Array<{ timestamp: string; events: number; alerts: number }>> {
    return this.request('/dashboard/activity-chart');
  }

  async getAlerts(filters?: AlertFilterOptions): Promise<Alert[]> {
    const query = new URLSearchParams();
    if (filters?.severity) query.set('severity', filters.severity);
    if (filters?.status) query.set('status', filters.status);
    if (filters?.search) query.set('search', filters.search);
    return this.request<Alert[]>(`/alerts?${query.toString()}`);
  }

  async getAlertById(id: string): Promise<Alert | null> {
    return this.request<Alert>(`/alerts/${id}`);
  }

  async updateAlertStatus(id: string, status: AlertStatus, note?: string): Promise<Alert> {
    return this.request<Alert>(`/alerts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
  }

  async escalateAlertToIncident(alertId: string, payload?: import('@/types/security').CreateIncidentPayload | string): Promise<Incident> {
    const body = typeof payload === 'string' ? { title: payload } : payload;
    return this.request<Incident>(`/alerts/${alertId}/escalate`, {
      method: 'POST',
      body: JSON.stringify(body || {}),
    });
  }

  async linkAlertToIncident(alertId: string, incidentId: string): Promise<Incident> {
    return this.request<Incident>(`/alerts/${alertId}/link`, {
      method: 'POST',
      body: JSON.stringify({ incidentId }),
    });
  }

  async getIncidents(filters?: IncidentFilterOptions): Promise<Incident[]> {
    const query = new URLSearchParams();
    if (filters?.severity) query.set('severity', filters.severity);
    if (filters?.status) query.set('status', filters.status);
    if (filters?.search) query.set('search', filters.search);
    return this.request<Incident[]>(`/incidents?${query.toString()}`);
  }

  async getIncidentById(id: string): Promise<Incident | null> {
    return this.request<Incident>(`/incidents/${id}`);
  }

  async updateIncidentStatus(id: string, status: IncidentStatus): Promise<Incident> {
    return this.request<Incident>(`/incidents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateIncidentSeverity(id: string, severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'): Promise<Incident> {
    return this.request<Incident>(`/incidents/${id}/severity`, {
      method: 'PATCH',
      body: JSON.stringify({ severity }),
    });
  }

  async assignIncidentAnalyst(id: string, analyst: string): Promise<Incident> {
    return this.request<Incident>(`/incidents/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ analyst }),
    });
  }

  async addIncidentNote(incidentId: string, author: string, content: string): Promise<Incident> {
    return this.request<Incident>(`/incidents/${incidentId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ author, content }),
    });
  }

  async getEvents(filters?: EventFilterOptions): Promise<WindowsSecurityEvent[]> {
    const query = new URLSearchParams();
    if (filters?.eventId) query.set('eventId', filters.eventId.toString());
    if (filters?.hostname) query.set('hostname', filters.hostname);
    if (filters?.search) query.set('search', filters.search);
    return this.request<WindowsSecurityEvent[]>(`/events?${query.toString()}`);
  }

  async getEventById(id: string): Promise<WindowsSecurityEvent | null> {
    return this.request<WindowsSecurityEvent>(`/events/${id}`);
  }

  async getAssets(): Promise<Asset[]> {
    return this.request<Asset[]>('/assets');
  }

  async getAssetById(id: string): Promise<Asset | null> {
    return this.request<Asset>(`/assets/${id}`);
  }

  async isolateAsset(id: string, isolate: boolean): Promise<Asset> {
    return this.request<Asset>(`/assets/${id}/isolation`, {
      method: 'POST',
      body: JSON.stringify({ isolate }),
    });
  }

  async getDetectionRules(): Promise<DetectionRule[]> {
    return this.request<DetectionRule[]>('/rules');
  }

  async getDetectionRuleById(id: string): Promise<DetectionRule | null> {
    return this.request<DetectionRule>(`/rules/${id}`);
  }

  async toggleRuleStatus(id: string, enabled: boolean): Promise<DetectionRule> {
    return this.request<DetectionRule>(`/rules/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
  }

  async testDetectionRule(ruleId: string): Promise<{ matched: boolean; sampleEvent: string; message: string }> {
    return this.request(`/rules/${ruleId}/test`, { method: 'POST' });
  }

  async getThreatIntel(): Promise<ThreatIndicator[]> {
    return this.request<ThreatIndicator[]>('/threat-intel');
  }

  async getThreatIndicatorByValue(value: string): Promise<ThreatIndicator | null> {
    return this.request<ThreatIndicator>(`/threat-intel/lookup?value=${encodeURIComponent(value)}`);
  }

  async startAIInvestigation(incidentId: string): Promise<AIInvestigationResult> {
    return this.request<AIInvestigationResult>(`/incidents/${incidentId}/ai-investigate`, {
      method: 'POST',
    });
  }

  async getAIInvestigation(incidentId: string): Promise<AIInvestigationResult | null> {
    return this.request<AIInvestigationResult>(`/incidents/${incidentId}/ai-investigate`);
  }

  async updateRecommendationStatus(
    incidentId: string,
    recId: string,
    status: RecommendationStatus
  ): Promise<AIInvestigationResult> {
    return this.request<AIInvestigationResult>(`/incidents/${incidentId}/recommendations/${recId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getInvestigationReport(incidentId: string): Promise<InvestigationReport | null> {
    return this.request<InvestigationReport>(`/incidents/${incidentId}/report`);
  }

  async generateInvestigationReport(incidentId: string): Promise<InvestigationReport> {
    return this.request<InvestigationReport>(`/incidents/${incidentId}/report/generate`, {
      method: 'POST',
    });
  }

  async getAuditLogs(): Promise<AnalystAuditLog[]> {
    return this.request<AnalystAuditLog[]>('/audit-logs');
  }

  async addAuditLog(entry: Omit<AnalystAuditLog, 'id' | 'timestamp'>): Promise<AnalystAuditLog> {
    return this.request<AnalystAuditLog>('/audit-logs', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async searchOmni(query: string): Promise<OmniSearchResult[]> {
    return this.request<OmniSearchResult[]>(`/search?q=${encodeURIComponent(query)}`);
  }

  async getSystemHealth(): Promise<SystemHealth> {
    return this.request<SystemHealth>('/system/health');
  }

  async setMode(mode: 'MOCK_DEMO' | 'REAL_FASTAPI'): Promise<void> {
    this.mode = mode;
  }

  getCurrentMode(): 'MOCK_DEMO' | 'REAL_FASTAPI' {
    return this.mode;
  }
}
