export type WindowsEventId = 4624 | 4625 | 4688 | 4672 | 7045 | 1102 | 4720 | 4726;

export interface WindowsSecurityEvent {
  id: string;
  timestamp: string; // ISO 8601
  eventId: WindowsEventId;
  eventName: string; // e.g. "An account was successfully logged on", "Process Creation"
  hostname: string;
  sourceIp?: string;
  destinationIp?: string;
  username: string;
  domain: string;
  processName?: string;
  processCommandLine?: string;
  parentProcessName?: string;
  logonType?: number; // 2=Interactive, 3=Network, 10=RemoteInteractive
  provider: 'Microsoft-Windows-Security-Auditing' | 'Microsoft-Windows-Sysmon';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'AUDIT_SUCCESS' | 'AUDIT_FAILURE';
  detectionRelevance?: string;
  relatedAlertId?: string;
  relatedIncidentId?: string;
  rawXmlOrJson: Record<string, any>;
}
