import { WindowsSecurityEvent } from './events';
import { DetectionRule } from './rules';
import { ThreatIndicator } from './threatIntel';

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type AlertStatus = 'NEW' | 'INVESTIGATING' | 'ESCALATED' | 'DISMISSED' | 'RESOLVED';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'ERADICATED' | 'CLOSED';
export type AssetHealth = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE';

export interface AlertEvidence {
  keyIndicators: string[];
  rawEventIds: string[];
  contextSnippet: string;
  matchedRuleLogic: string;
}

export interface Alert {
  id: string; // e.g. "ALT-2026-8812"
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  assetId: string;
  hostname: string;
  sourceIp?: string;
  destinationIp?: string;
  username?: string;
  ruleId: string;
  ruleName: string;
  mitreTechniqueId?: string;
  mitreTechniqueName?: string;
  mitreTactic?: string;
  whyTriggered?: string;
  associatedIocValues?: string[];
  confidenceScore: number; // 0 - 100
  detectedAt: string; // ISO 8601
  incidentId?: string; // If escalated
  evidence: AlertEvidence;
  relatedEvents?: WindowsSecurityEvent[];
}

export interface CreateIncidentPayload {
  title?: string;
  severity?: AlertSeverity;
  riskScore?: number;
  assignedAnalyst?: string;
  description?: string;
}

export interface IncidentTimelineEvent {
  id: string;
  timestamp: string;
  stage: 'EVENT' | 'DETECTION' | 'ALERT' | 'INCIDENT_CREATED' | 'AI_ANALYSIS' | 'CONTAINMENT';
  title: string;
  description: string;
  sourceType: 'Windows Event' | 'Sigma Rule' | 'Alert Engine' | 'SOC Analyst' | 'AI Agent';
  referenceId?: string;
}

export interface IncidentNote {
  id: string;
  timestamp: string;
  author: string;
  content: string;
}

export interface Incident {
  id: string; // e.g. "INC-2026-0421"
  title: string;
  severity: AlertSeverity;
  riskScore: number; // 0 - 100
  status: IncidentStatus;
  assignedAnalyst: string;
  affectedAssetIds: string[];
  alertIds: string[];
  rootCauseHypothesis: string;
  createdAt: string;
  updatedAt: string;
  mitreTactics: string[];
  timeline: IncidentTimelineEvent[];
  notes?: IncidentNote[];
  isAiAnalyzed?: boolean;
}

export interface Asset {
  id: string; // e.g. "AST-101"
  hostname: string;
  ipAddress: string;
  macAddress: string;
  operatingSystem: string;
  role: 'Domain Controller' | 'Workstation' | 'Application Server' | 'Database Server' | 'Edge Gateway';
  health: AssetHealth;
  riskScore: number; // 0 - 100
  openAlertCount: number;
  incidentCount: number;
  lastSeen: string;
  assignedUser?: string;
  department?: string;
  isolationStatus: 'ISOLATED' | 'NORMAL';
  recentEventIds?: string[];
  associatedIocs?: string[];
}

export type AIWorkflowStage =
  | 'QUEUED'
  | 'COLLECTING_EVIDENCE'
  | 'CORRELATING_EVENTS'
  | 'ANALYZING_DETECTION_RULES'
  | 'MAPPING_MITRE_ATTACK'
  | 'ASSESSING_RISK'
  | 'GENERATING_REPORT'
  | 'COMPLETED'
  | 'FAILED';

export interface AIInvestigationStep {
  stage: AIWorkflowStage;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  detail: string;
  timestamp?: string;
}

export type RecommendationStatus = 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'EXECUTED';

export interface AIRecommendationItem {
  id: string;
  action: string;
  severity: AlertSeverity;
  target: string;
  reason: string;
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM';
  status: RecommendationStatus;
  isAutomatedAvailable: boolean;
  executedAt?: string;
}

export interface AIInvestigationResult {
  incidentId: string;
  status: AIWorkflowStage;
  currentStepIndex: number;
  steps: AIInvestigationStep[];
  
  // Explicit separation:
  observedEvidence: {
    corroboratedEventsCount: number;
    detectionRuleMatches: string[];
    affectedHostnames: string[];
    extractedIocs: Array<{ type: string; value: string }>;
    rawEvidenceSummary: string[];
  };

  simulatedAiAssessment: {
    label: 'SIMULATED AI ASSESSMENT';
    inferredAttackPattern: string;
    threatClassification: string;
    mitreTactics: string[];
    mitreTechniques: Array<{ id: string; name: string }>;
    confidenceScore: number; // e.g. 96
    confidenceDisclaimer: 'Assessment confidence — simulated';
    assessmentRationale: string;
  };

  recommendations: {
    containmentActions: AIRecommendationItem[];
    investigativeNextSteps: string[];
    longTermRemediation: string[];
  };

  completedAt?: string;
}

export interface AnalystAuditLog {
  id: string;
  timestamp: string;
  analyst: string;
  action: string;
  targetType: 'ALERT' | 'INCIDENT' | 'ASSET' | 'RULE' | 'AI_INVESTIGATION' | 'REPORT';
  targetId: string;
  details: string;
}

export interface InvestigationReport {
  id: string; // e.g. "REP-2026-0421"
  incidentId: string;
  generatedAt: string;
  classification: 'CONFIDENTIAL // SOC INTERNAL USE';
  title: string;
  severity: AlertSeverity;
  executiveSummary: string;
  observedEvidence: {
    summary: string;
    eventsAnalyzed: number;
    affectedAssets: string[];
    iocs: string[];
  };
  simulatedAiAssessment: {
    verdict: string;
    threatActor: string;
    confidence: number;
    disclaimer: string;
    technicalDetails: string;
  };
  recommendedActions: Array<{
    category: 'Containment' | 'Remediation' | 'Hardening';
    action: string;
    status: 'COMPLETED' | 'PENDING' | 'MANUAL_REQUIRED';
  }>;
  analystActionHistory?: Array<{
    timestamp: string;
    analyst: string;
    action: string;
  }>;
}

export interface SOCDashboardStats {
  criticalAlertsCount: number;
  highAlertsCount: number;
  activeIncidentsCount: number;
  eventsLast24Hours: number;
  meanTimeToDetectMinutes: number;
  meanTimeToAcknowledgeMinutes: number;
  systemStatus: 'LIVE' | 'DEGRADED' | 'OFFLINE';
  lastSyncTime: string;
}

export interface SystemHealth {
  apiStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  collectorStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  databaseStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  aiEngineStatus: 'ONLINE' | 'SIMULATED_DEMO_MODE' | 'OFFLINE';
  activeMode: 'MOCK_DEMO' | 'REAL_FASTAPI';
  eventsProcessedPerSecond: number;
  uptimeSeconds: number;
  lastHealthCheck: string;
}

export interface OmniSearchResult {
  id: string;
  category: 'ALERT' | 'INCIDENT' | 'EVENT' | 'ASSET' | 'IOC' | 'RULE' | 'ROUTE';
  title: string;
  subtitle: string;
  url: string;
  badge?: string;
  severity?: AlertSeverity | 'HEALTHY';
}
