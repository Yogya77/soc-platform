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
import {
  initialDashboardStats,
  initialSystemHealth,
  initialAuditLogs,
  mockAssets,
  mockEvents,
  mockDetectionRules,
  mockThreatIntel,
  mockAlerts,
  mockIncidents,
  mockAiInvestigation,
  mockInvestigationReport,
} from './mock.data';

export class MockSecurityService implements ISecurityService {
  private alerts: Alert[] = [...mockAlerts];
  private incidents: Incident[] = [...mockIncidents];
  private events: WindowsSecurityEvent[] = [...mockEvents];
  private assets: Asset[] = [...mockAssets];
  private rules: DetectionRule[] = [...mockDetectionRules];
  private threatIntel: ThreatIndicator[] = [...mockThreatIntel];
  private auditLogs: AnalystAuditLog[] = [...initialAuditLogs];
  private auditLogCounter: number = 2000;
  private aiInvestigations: Map<string, AIInvestigationResult> = new Map([
    ['INC-2026-0421', JSON.parse(JSON.stringify(mockAiInvestigation))],
  ]);
  private reports: Map<string, InvestigationReport> = new Map([
    ['INC-2026-0421', JSON.parse(JSON.stringify(mockInvestigationReport))],
  ]);
  private mode: 'MOCK_DEMO' | 'REAL_FASTAPI' = 'MOCK_DEMO';

  async getDashboardStats(): Promise<SOCDashboardStats> {
    const criticalAlerts = this.alerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'DISMISSED' && a.status !== 'RESOLVED').length;
    const highAlerts = this.alerts.filter((a) => a.severity === 'HIGH' && a.status !== 'DISMISSED' && a.status !== 'RESOLVED').length;
    const activeIncidents = this.incidents.filter((i) => i.status !== 'CLOSED').length;

    return {
      ...initialDashboardStats,
      criticalAlertsCount: criticalAlerts,
      highAlertsCount: highAlerts,
      activeIncidentsCount: activeIncidents,
      lastSyncTime: new Date().toISOString(),
    };
  }

  async getActivityTimeSeries(): Promise<Array<{ timestamp: string; events: number; alerts: number }>> {
    const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Current'];
    const eventCounts = [1420, 980, 4820, 7120, 6200, 3100, 1251];
    const alertCounts = [0, 0, 1, 3, 2, 4, 1];

    return hours.map((hour, idx) => ({
      timestamp: hour,
      events: eventCounts[idx],
      alerts: alertCounts[idx],
    }));
  }

  async getAlerts(filters?: AlertFilterOptions): Promise<Alert[]> {
    let result = [...this.alerts];
    if (filters?.severity && filters.severity !== 'ALL') {
      result = result.filter((a) => a.severity === filters.severity);
    }
    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((a) => a.status === filters.status);
    }
    if (filters?.assetId) {
      result = result.filter((a) => a.assetId === filters.assetId);
    }
    if (filters?.ruleId) {
      result = result.filter((a) => a.ruleId === filters.ruleId);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          a.hostname.toLowerCase().includes(q) ||
          a.ruleName.toLowerCase().includes(q)
      );
    }
    return result;
  }

  async getAlertById(id: string): Promise<Alert | null> {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert) return null;
    // Correlate with real event objects if available
    const relatedEvents = this.events.filter((e) => alert.evidence.rawEventIds.includes(e.id));
    return { ...alert, relatedEvents };
  }

  async updateAlertStatus(id: string, status: AlertStatus, note?: string): Promise<Alert> {
    const idx = this.alerts.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error(`Alert with id ${id} not found.`);
    this.alerts[idx] = { ...this.alerts[idx], status };

    await this.addAuditLog({
      analyst: 'Sarah Jenkins',
      action: `ALERT_STATUS_${status}`,
      targetType: 'ALERT',
      targetId: id,
      details: note || `Updated alert ${id} status to ${status}.`,
    });

    return this.alerts[idx];
  }

  async escalateAlertToIncident(alertId: string, payload?: import('@/types/security').CreateIncidentPayload | string): Promise<Incident> {
    const alert = await this.getAlertById(alertId);
    if (!alert) throw new Error(`Alert with id ${alertId} not found.`);

    const title = typeof payload === 'string' ? payload : payload?.title || `Incident generated from ${alert.title}`;
    const severity = typeof payload === 'object' && payload?.severity ? payload.severity : alert.severity;
    const riskScore = typeof payload === 'object' && payload?.riskScore !== undefined
      ? payload.riskScore
      : (alert.severity === 'CRITICAL' ? 90 : alert.severity === 'HIGH' ? 75 : 50);
    const assignedAnalyst = typeof payload === 'object' && payload?.assignedAnalyst ? payload.assignedAnalyst : 'Sarah Jenkins (Lead IR)';
    const rootCauseHypothesis = typeof payload === 'object' && payload?.description
      ? payload.description
      : (alert.whyTriggered || alert.description || `Investigation triggered by rule ${alert.ruleName} on host ${alert.hostname}.`);

    const newIncidentId = `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newIncident: Incident = {
      id: newIncidentId,
      title,
      severity,
      riskScore,
      status: 'OPEN',
      assignedAnalyst,
      affectedAssetIds: [alert.assetId],
      alertIds: [alert.id],
      rootCauseHypothesis,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mitreTactics: [alert.mitreTactic || 'Execution'],
      notes: [
        {
          id: `NOTE-${Date.now()}`,
          timestamp: new Date().toISOString(),
          author: assignedAnalyst,
          content: `Incident escalated from Alert ${alert.id} (${alert.title}). Initial analyst assessment: ${rootCauseHypothesis}`,
        },
      ],
      timeline: [
        {
          id: `TL-${Date.now()}`,
          timestamp: new Date().toISOString(),
          stage: 'INCIDENT_CREATED',
          title: `Incident created from Alert ${alert.id}`,
          description: rootCauseHypothesis,
          sourceType: 'SOC Analyst',
          referenceId: alert.id,
        },
      ],
    };

    this.incidents.unshift(newIncident);
    await this.updateAlertStatus(alertId, 'ESCALATED', `Escalated alert to ${newIncidentId}`);
    return newIncident;
  }

  async linkAlertToIncident(alertId: string, incidentId: string): Promise<Incident> {
    const incIdx = this.incidents.findIndex((i) => i.id === incidentId);
    if (incIdx === -1) throw new Error(`Incident ${incidentId} not found.`);
    const alert = await this.getAlertById(alertId);
    if (!alert) throw new Error(`Alert ${alertId} not found.`);

    if (!this.incidents[incIdx].alertIds.includes(alertId)) {
      this.incidents[incIdx].alertIds.push(alertId);
    }
    if (!this.incidents[incIdx].affectedAssetIds.includes(alert.assetId)) {
      this.incidents[incIdx].affectedAssetIds.push(alert.assetId);
    }

    this.incidents[incIdx].updatedAt = new Date().toISOString();
    await this.updateAlertStatus(alertId, 'ESCALATED', `Linked to existing incident ${incidentId}`);
    return this.incidents[incIdx];
  }

  async getIncidents(filters?: IncidentFilterOptions): Promise<Incident[]> {
    let result = [...this.incidents];
    if (filters?.severity && filters.severity !== 'ALL') {
      result = result.filter((i) => i.severity === filters.severity);
    }
    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((i) => i.status === filters.status);
    }
    if (filters?.assignedAnalyst && filters.assignedAnalyst !== 'ALL') {
      result = result.filter((i) => i.assignedAnalyst.includes(filters.assignedAnalyst!));
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q) ||
          i.rootCauseHypothesis.toLowerCase().includes(q)
      );
    }
    return result;
  }

  async getIncidentById(id: string): Promise<Incident | null> {
    const inc = this.incidents.find((i) => i.id === id);
    return inc ? JSON.parse(JSON.stringify(inc)) : null;
  }

  async updateIncidentStatus(id: string, status: IncidentStatus): Promise<Incident> {
    const idx = this.incidents.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error(`Incident with id ${id} not found.`);
    this.incidents[idx] = {
      ...this.incidents[idx],
      status,
      updatedAt: new Date().toISOString(),
    };

    await this.addAuditLog({
      analyst: 'Sarah Jenkins',
      action: `INCIDENT_STATUS_${status}`,
      targetType: 'INCIDENT',
      targetId: id,
      details: `Updated incident ${id} status to ${status}.`,
    });

    return this.incidents[idx];
  }

  async updateIncidentSeverity(id: string, severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'): Promise<Incident> {
    const idx = this.incidents.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error(`Incident with id ${id} not found.`);
    this.incidents[idx] = {
      ...this.incidents[idx],
      severity,
      updatedAt: new Date().toISOString(),
    };

    await this.addAuditLog({
      analyst: 'Sarah Jenkins',
      action: 'INCIDENT_SEVERITY_CHANGED',
      targetType: 'INCIDENT',
      targetId: id,
      details: `Changed incident ${id} severity to ${severity}.`,
    });

    return this.incidents[idx];
  }

  async assignIncidentAnalyst(id: string, analyst: string): Promise<Incident> {
    const idx = this.incidents.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error(`Incident with id ${id} not found.`);
    this.incidents[idx] = {
      ...this.incidents[idx],
      assignedAnalyst: analyst,
      updatedAt: new Date().toISOString(),
    };

    await this.addAuditLog({
      analyst: 'Sarah Jenkins',
      action: 'INCIDENT_ANALYST_ASSIGNED',
      targetType: 'INCIDENT',
      targetId: id,
      details: `Assigned analyst ${analyst} to ${id}.`,
    });

    return this.incidents[idx];
  }

  async addIncidentNote(incidentId: string, author: string, content: string): Promise<Incident> {
    const idx = this.incidents.findIndex((i) => i.id === incidentId);
    if (idx === -1) throw new Error(`Incident ${incidentId} not found.`);
    const newNote = {
      id: `NOTE-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author,
      content,
    };
    const notes = this.incidents[idx].notes || [];
    this.incidents[idx] = {
      ...this.incidents[idx],
      notes: [newNote, ...notes],
      updatedAt: new Date().toISOString(),
    };

    await this.addAuditLog({
      analyst: author,
      action: 'INCIDENT_NOTE_ADDED',
      targetType: 'INCIDENT',
      targetId: incidentId,
      details: `Added note: "${content.slice(0, 60)}..."`,
    });

    return this.incidents[idx];
  }

  async getEvents(filters?: EventFilterOptions): Promise<WindowsSecurityEvent[]> {
    let result = [...this.events];
    if (filters?.eventId) {
      result = result.filter((e) => e.eventId === filters.eventId);
    }
    if (filters?.hostname && filters.hostname !== 'ALL') {
      result = result.filter((e) => e.hostname === filters.hostname);
    }
    if (filters?.username) {
      result = result.filter((e) => e.username.toLowerCase().includes(filters.username!.toLowerCase()));
    }
    if (filters?.severity && filters.severity !== 'ALL') {
      result = result.filter((e) => e.severity === filters.severity);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.eventName.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          (e.processCommandLine && e.processCommandLine.toLowerCase().includes(q)) ||
          (e.sourceIp && e.sourceIp.toLowerCase().includes(q))
      );
    }
    return result.slice(0, filters?.limit || 100);
  }

  async getEventById(id: string): Promise<WindowsSecurityEvent | null> {
    const event = this.events.find((e) => e.id === id);
    return event ? { ...event } : null;
  }

  async getAssets(): Promise<Asset[]> {
    return [...this.assets];
  }

  async getAssetById(id: string): Promise<Asset | null> {
    const asset = this.assets.find((a) => a.id === id || a.hostname.toLowerCase() === id.toLowerCase());
    return asset ? { ...asset } : null;
  }

  async isolateAsset(id: string, isolate: boolean): Promise<Asset> {
    const idx = this.assets.findIndex((a) => a.id === id || a.hostname === id);
    if (idx === -1) throw new Error(`Asset ${id} not found.`);
    this.assets[idx] = {
      ...this.assets[idx],
      isolationStatus: isolate ? 'ISOLATED' : 'NORMAL',
    };

    await this.addAuditLog({
      analyst: 'Sarah Jenkins',
      action: isolate ? 'ASSET_ISOLATED' : 'ASSET_ISOLATION_REMOVED',
      targetType: 'ASSET',
      targetId: this.assets[idx].id,
      details: isolate
        ? `Network quarantine enabled for host ${this.assets[idx].hostname} (${this.assets[idx].ipAddress}).`
        : `Network quarantine released for host ${this.assets[idx].hostname}.`,
    });

    return this.assets[idx];
  }

  async getDetectionRules(): Promise<DetectionRule[]> {
    return [...this.rules];
  }

  async getDetectionRuleById(id: string): Promise<DetectionRule | null> {
    const rule = this.rules.find((r) => r.id === id);
    return rule ? { ...rule } : null;
  }

  async toggleRuleStatus(id: string, enabled: boolean): Promise<DetectionRule> {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Rule ${id} not found.`);
    this.rules[idx] = {
      ...this.rules[idx],
      status: enabled ? 'ACTIVE' : 'DISABLED',
    };

    await this.addAuditLog({
      analyst: 'Sarah Jenkins',
      action: enabled ? 'RULE_ENABLED' : 'RULE_DISABLED',
      targetType: 'RULE',
      targetId: id,
      details: `Detection rule ${this.rules[idx].name} set to ${this.rules[idx].status}.`,
    });

    return this.rules[idx];
  }

  async testDetectionRule(ruleId: string): Promise<{ matched: boolean; sampleEvent: string; message: string }> {
    const rule = await this.getDetectionRuleById(ruleId);
    if (!rule) throw new Error(`Rule ${ruleId} not found.`);

    await this.addAuditLog({
      analyst: 'Sarah Jenkins',
      action: 'RULE_TESTED',
      targetType: 'RULE',
      targetId: ruleId,
      details: `Executed rule test against live telemetry stream. 1 sample match identified.`,
    });

    return {
      matched: true,
      sampleEvent: rule.exampleMatchingEvent || 'Matched Event ID 4688 / PowerShell execution',
      message: `Rule syntax validated against current telemetry baseline. Trigger confidence: 99%.`,
    };
  }

  async getThreatIntel(): Promise<ThreatIndicator[]> {
    return [...this.threatIntel];
  }

  async getThreatIndicatorByValue(value: string): Promise<ThreatIndicator | null> {
    const indicator = this.threatIntel.find((i) => i.indicator.toLowerCase() === value.toLowerCase() || i.id.toLowerCase() === value.toLowerCase());
    return indicator ? { ...indicator } : null;
  }

  async startAIInvestigation(
    incidentId: string,
    onStepUpdate?: (stepIndex: number) => void
  ): Promise<AIInvestigationResult> {
    const result: AIInvestigationResult = JSON.parse(JSON.stringify(mockAiInvestigation));
    result.incidentId = incidentId;
    this.aiInvestigations.set(incidentId, result);

    await this.addAuditLog({
      analyst: 'AI Analyst Engine',
      action: 'AI_INVESTIGATION_STARTED',
      targetType: 'AI_INVESTIGATION',
      targetId: incidentId,
      details: `Initiated 8-stage automated reasoning sequence for ${incidentId}.`,
    });

    return result;
  }

  async getAIInvestigation(incidentId: string): Promise<AIInvestigationResult | null> {
    const result = this.aiInvestigations.get(incidentId);
    return result ? JSON.parse(JSON.stringify(result)) : null;
  }

  async updateRecommendationStatus(
    incidentId: string,
    recId: string,
    status: RecommendationStatus
  ): Promise<AIInvestigationResult> {
    const investigation = this.aiInvestigations.get(incidentId);
    if (!investigation) throw new Error(`Investigation for incident ${incidentId} not found.`);

    const recIdx = investigation.recommendations.containmentActions.findIndex((r) => r.id === recId);
    if (recIdx !== -1) {
      investigation.recommendations.containmentActions[recIdx].status = status;
      if (status === 'APPROVED' || status === 'EXECUTED') {
        investigation.recommendations.containmentActions[recIdx].executedAt = new Date().toISOString();
        // If it's host isolation recommendation REC-1, automatically isolate WKS-FIN-04
        if (recId === 'REC-1') {
          await this.isolateAsset('AST-102', true);
        }
      } else if (status === 'REJECTED' && recId === 'REC-1') {
        await this.isolateAsset('AST-102', false);
      }
    }

    this.aiInvestigations.set(incidentId, investigation);

    await this.addAuditLog({
      analyst: 'Sarah Jenkins',
      action: `AI_RECOMMENDATION_${status}`,
      targetType: 'AI_INVESTIGATION',
      targetId: recId,
      details: `Recommendation ${recId} status set to ${status}.`,
    });

    return investigation;
  }

  async getInvestigationReport(incidentId: string): Promise<InvestigationReport | null> {
    const report = this.reports.get(incidentId);
    return report ? JSON.parse(JSON.stringify(report)) : null;
  }

  async generateInvestigationReport(incidentId: string): Promise<InvestigationReport> {
    const incident = await this.getIncidentById(incidentId);
    const investigation = await this.getAIInvestigation(incidentId);

    const reportId = `REP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReport: InvestigationReport = {
      id: reportId,
      incidentId: incidentId,
      generatedAt: new Date().toISOString(),
      classification: 'CONFIDENTIAL // SOC INTERNAL USE',
      title: `Executive Incident Response Report: ${incident?.title || 'Multi-Stage Threat Investigation'}`,
      severity: incident?.severity || 'CRITICAL',
      executiveSummary: `On ${new Date().toLocaleDateString()}, the SOC responded to security incident ${incidentId}. Correlated telemetry confirmed multi-stage lateral movement. Containment playbooks have been proposed and reviewed.`,
      observedEvidence: {
        summary: `${investigation?.observedEvidence.corroboratedEventsCount || 6} corroborated security events across multiple host boundaries.`,
        eventsAnalyzed: investigation?.observedEvidence.corroboratedEventsCount || 6,
        affectedAssets: incident?.affectedAssetIds || ['AST-102', 'AST-101'],
        iocs: ['198.51.100.42 (Simulated Threat IP)', 'PSEXESVC.exe', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 (Simulated Memory Hash)'],
      },
      simulatedAiAssessment: {
        verdict: investigation?.simulatedAiAssessment.inferredAttackPattern || 'Targeted Multi-Stage Intrusion',
        threatActor: 'Simulated Threat Unit (Demo)',
        confidence: investigation?.simulatedAiAssessment.confidenceScore || 96,
        disclaimer: 'Assessment confidence — simulated analytical inference',
        technicalDetails: investigation?.simulatedAiAssessment.assessmentRationale || 'Temporal correlation of anomalous logon failures and administrative service installation.',
      },
      recommendedActions: [
        { category: 'Containment', action: 'Workstation isolation of WKS-FIN-04', status: 'COMPLETED' },
        { category: 'Containment', action: 'Perimeter firewall block on 198.51.100.42', status: 'COMPLETED' },
        { category: 'Remediation', action: 'Active Directory KRBTGT password rotation', status: 'PENDING' },
      ],
      analystActionHistory: this.auditLogs.slice(0, 5).map((l) => ({
        timestamp: new Date(l.timestamp).toLocaleTimeString(),
        analyst: l.analyst,
        action: l.details,
      })),
    };

    this.reports.set(incidentId, newReport);

    await this.addAuditLog({
      analyst: 'Sarah Jenkins',
      action: 'REPORT_GENERATED',
      targetType: 'REPORT',
      targetId: reportId,
      details: `Generated formal incident investigation report ${reportId} for ${incidentId}.`,
    });

    return newReport;
  }

  async getAuditLogs(): Promise<AnalystAuditLog[]> {
    return [...this.auditLogs];
  }

  async addAuditLog(entry: Omit<AnalystAuditLog, 'id' | 'timestamp'>): Promise<AnalystAuditLog> {
    this.auditLogCounter += 1;
    const newLog: AnalystAuditLog = {
      ...entry,
      id: `AUD-${this.auditLogCounter}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(newLog);
    return newLog;
  }

  async searchOmni(query: string): Promise<OmniSearchResult[]> {
    if (!query || !query.trim()) return [];
    const q = query.toLowerCase().trim().replace(/^\//, '');
    const results: OmniSearchResult[] = [];

    // Search Direct Navigation Pages/Routes
    const routeMappings = [
      { name: 'Dashboard (Security Overview)', path: '/dashboard', keywords: ['dash', 'dashboard', 'overview', 'kpi', 'home'] },
      { name: 'Alerts Triage Queue', path: '/alerts', keywords: ['alert', 'alerts', 'triage', 'queue'] },
      { name: 'Incident Command Center', path: '/incidents', keywords: ['incident', 'incidents', 'command', 'ir', 'response'] },
      { name: 'Windows Security Event Logs', path: '/events', keywords: ['event', 'events', 'log', 'logs', 'telemetry', '4624', '4625', '4688', '7045'] },
      { name: 'Threat Intelligence Explorer', path: '/threat-intel', keywords: ['threat', 'intel', 'ioc', 'indicators', 'hashes', 'domains', 'reputation'] },
      { name: 'AI Analyst Investigation Workbench', path: '/ai-analyst', keywords: ['ai', 'analyst', 'agent', 'investigate', 'reasoning', 'workbench'] },
      { name: 'Investigation & Compliance Reports', path: '/reports', keywords: ['report', 'reports', 'forensics', 'compliance', 'export', 'print'] },
      { name: 'Asset Inventory & Risk Register', path: '/assets', keywords: ['asset', 'assets', 'host', 'hosts', 'workstation', 'server', 'quarantine', 'isolation'] },
      { name: 'SIEM & Sigma Detection Rules', path: '/rules', keywords: ['rule', 'rules', 'sigma', 'detection', 'siem', 'tactic', 'mitre'] },
      { name: 'SOC Settings & Health Monitor', path: '/settings', keywords: ['setting', 'settings', 'config', 'health', 'mode', 'collector'] },
    ];

    routeMappings.forEach((r) => {
      if (r.keywords.some((k) => k.includes(q) || q.includes(k)) || r.name.toLowerCase().includes(q)) {
        results.push({
          id: r.path,
          category: 'ROUTE',
          title: `Navigate to ${r.name}`,
          subtitle: `Route: ${r.path}`,
          url: r.path,
        });
      }
    });

    // Search Alerts
    this.alerts.forEach((a) => {
      if (
        a.id.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.hostname.toLowerCase().includes(q) ||
        a.ruleName.toLowerCase().includes(q)
      ) {
        results.push({
          id: a.id,
          category: 'ALERT',
          title: `${a.id}: ${a.title}`,
          subtitle: `Host: ${a.hostname} | Status: ${a.status}`,
          url: `/alerts/${a.id}`,
          severity: a.severity,
        });
      }
    });

    // Search Incidents
    this.incidents.forEach((i) => {
      if (
        i.id.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        i.assignedAnalyst.toLowerCase().includes(q)
      ) {
        results.push({
          id: i.id,
          category: 'INCIDENT',
          title: `${i.id}: ${i.title}`,
          subtitle: `Risk: ${i.riskScore}/100 | Assigned: ${i.assignedAnalyst}`,
          url: `/incidents/${i.id}`,
          severity: i.severity,
        });
      }
    });

    // Search Events
    this.events.forEach((e) => {
      if (
        e.id.toLowerCase().includes(q) ||
        e.eventName.toLowerCase().includes(q) ||
        e.eventId.toString().includes(q) ||
        e.hostname.toLowerCase().includes(q) ||
        (e.sourceIp && e.sourceIp.toLowerCase().includes(q))
      ) {
        results.push({
          id: e.id,
          category: 'EVENT',
          title: `Event ${e.eventId} (${e.id}): ${e.eventName}`,
          subtitle: `Host: ${e.hostname} | Account: ${e.username}`,
          url: `/events`,
          severity: e.severity === 'CRITICAL' ? 'CRITICAL' : e.severity === 'WARNING' ? 'HIGH' : 'INFO',
        });
      }
    });

    // Search Assets
    this.assets.forEach((ast) => {
      if (
        ast.hostname.toLowerCase().includes(q) ||
        ast.ipAddress.toLowerCase().includes(q) ||
        ast.id.toLowerCase().includes(q) ||
        ast.role.toLowerCase().includes(q)
      ) {
        results.push({
          id: ast.id,
          category: 'ASSET',
          title: `${ast.hostname} (${ast.ipAddress})`,
          subtitle: `Role: ${ast.role} | Health: ${ast.health} | Risk: ${ast.riskScore}`,
          url: `/assets/${ast.id}`,
          severity: ast.health === 'CRITICAL' ? 'CRITICAL' : ast.health === 'WARNING' ? 'HIGH' : 'HEALTHY',
        });
      }
    });

    // Search Threat Intel (IOCs)
    this.threatIntel.forEach((ioc) => {
      if (
        ioc.indicator.toLowerCase().includes(q) ||
        ioc.type.toLowerCase().includes(q) ||
        (ioc.threatActor && ioc.threatActor.toLowerCase().includes(q))
      ) {
        results.push({
          id: ioc.id,
          category: 'IOC',
          title: `${ioc.indicator} (${ioc.type})`,
          subtitle: `Verdict: ${ioc.verdict} | Source: ${ioc.sourceLabel}`,
          url: `/threat-intel`,
          badge: ioc.verdict,
        });
      }
    });

    // Search Rules
    this.rules.forEach((r) => {
      if (
        r.id.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.mitreTactic.toLowerCase().includes(q)
      ) {
        results.push({
          id: r.id,
          category: 'RULE',
          title: `${r.id}: ${r.name}`,
          subtitle: `Tactic: ${r.mitreTactic} | Status: ${r.status}`,
          url: `/rules`,
          severity: r.severity,
        });
      }
    });

    return results;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    return {
      ...initialSystemHealth,
      activeMode: this.mode,
      lastHealthCheck: new Date().toISOString(),
    };
  }

  async setMode(mode: 'MOCK_DEMO' | 'REAL_FASTAPI'): Promise<void> {
    this.mode = mode;
  }

  getCurrentMode(): 'MOCK_DEMO' | 'REAL_FASTAPI' {
    return this.mode;
  }
}
