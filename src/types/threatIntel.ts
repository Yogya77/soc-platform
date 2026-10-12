export type IndicatorType = 'IP' | 'DOMAIN' | 'HASH_SHA256' | 'HASH_MD5' | 'URL';
export type ThreatVerdict = 'MALICIOUS (SIMULATED)' | 'SUSPICIOUS' | 'BENIGN' | 'UNKNOWN';

export interface ThreatIndicator {
  id: string;
  indicator: string;
  type: IndicatorType;
  verdict: ThreatVerdict;
  confidenceScore: number; // 0 - 100
  sourceLabel: 'Demo Threat Intelligence Dataset' | 'Simulated Threat Feed';
  isSimulated: boolean;
  threatActor?: string;
  malwareFamily?: string;
  firstSeen: string;
  lastSeen: string;
  associatedHostnames: string[];
  associatedEventIds: string[];
  associatedAlertIds: string[];
  associatedIncidentIds: string[];
  mitreTechniques?: Array<{ id: string; name: string }>;
  tags: string[];
  description: string;
}
