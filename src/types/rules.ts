export type RuleSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface DetectionRule {
  id: string; // e.g. "RULE-WIN-001"
  name: string;
  description: string;
  severity: RuleSeverity;
  mitreTactic: 'Initial Access' | 'Execution' | 'Persistence' | 'Privilege Escalation' | 'Defense Evasion' | 'Credential Access' | 'Lateral Movement' | 'Command and Control';
  mitreTechniqueId: string; // e.g. "T1059.001", "T1078", "T1021.002"
  mitreTechniqueName: string;
  queryLogic: string; // Realistic SIEM query / Sigma syntax
  sigmaYaml?: string;
  exampleMatchingEvent?: string;
  eventSources: string[]; // e.g. ["Security:4688", "Sysmon:1"]
  status: 'ACTIVE' | 'DISABLED' | 'TESTING';
  lastTriggered: string | null;
  triggerCount: number;
  author: string;
  falsePositiveRate: 'LOW' | 'MEDIUM' | 'HIGH';
  associatedAlertIds?: string[];
  associatedIncidentIds?: string[];
}
