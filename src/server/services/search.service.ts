import { prisma } from '@/lib/prisma';
import { OmniSearchResult } from '@/types/security';

export class SearchService {
  static async searchOmni(query: string): Promise<OmniSearchResult[]> {
    if (!query || !query.trim()) return [];
    const q = query.toLowerCase().trim().replace(/^\//, '');
    const results: OmniSearchResult[] = [];

    // Static Route Mappings for fast module navigation
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

    // Database Search Queries across entities
    const [alerts, incidents, events, assets, iocs, rules] = await Promise.all([
      prisma.alert.findMany({
        where: {
          OR: [
            { id: { contains: q, mode: 'insensitive' } },
            { title: { contains: q, mode: 'insensitive' } },
            { hostname: { contains: q, mode: 'insensitive' } },
            { ruleName: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      prisma.incident.findMany({
        where: {
          OR: [
            { id: { contains: q, mode: 'insensitive' } },
            { title: { contains: q, mode: 'insensitive' } },
            { assignedAnalyst: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      prisma.securityEvent.findMany({
        where: {
          OR: [
            { id: { contains: q, mode: 'insensitive' } },
            { eventName: { contains: q, mode: 'insensitive' } },
            { hostname: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      prisma.asset.findMany({
        where: {
          OR: [
            { hostname: { contains: q, mode: 'insensitive' } },
            { ipAddress: { contains: q, mode: 'insensitive' } },
            { role: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      prisma.threatIndicator.findMany({
        where: {
          OR: [
            { indicator: { contains: q, mode: 'insensitive' } },
            { type: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      prisma.detectionRule.findMany({
        where: {
          OR: [
            { id: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
    ]);

    alerts.forEach((a) => {
      results.push({
        id: a.id,
        category: 'ALERT',
        title: `${a.id}: ${a.title}`,
        subtitle: `Host: ${a.hostname} | Status: ${a.status}`,
        url: `/alerts/${a.id}`,
        severity: a.severity as any,
      });
    });

    incidents.forEach((i) => {
      results.push({
        id: i.id,
        category: 'INCIDENT',
        title: `${i.id}: ${i.title}`,
        subtitle: `Risk: ${i.riskScore}/100 | Assigned: ${i.assignedAnalyst}`,
        url: `/incidents/${i.id}`,
        severity: i.severity as any,
      });
    });

    events.forEach((e) => {
      results.push({
        id: e.id,
        category: 'EVENT',
        title: `Event ${e.eventId} (${e.id}): ${e.eventName}`,
        subtitle: `Host: ${e.hostname} | Account: ${e.username}`,
        url: '/events',
        severity: e.severity === 'CRITICAL' ? 'CRITICAL' : e.severity === 'WARNING' ? 'HIGH' : 'INFO',
      });
    });

    assets.forEach((ast) => {
      results.push({
        id: ast.id,
        category: 'ASSET',
        title: `${ast.hostname} (${ast.ipAddress})`,
        subtitle: `Role: ${ast.role} | Health: ${ast.health} | Risk: ${ast.riskScore}`,
        url: `/assets/${ast.id}`,
        severity: ast.health === 'CRITICAL' ? 'CRITICAL' : ast.health === 'WARNING' ? 'HIGH' : 'HEALTHY',
      });
    });

    iocs.forEach((ioc) => {
      results.push({
        id: ioc.id,
        category: 'IOC',
        title: `${ioc.indicator} (${ioc.type})`,
        subtitle: `Verdict: ${ioc.verdict} | Source: ${ioc.sourceLabel}`,
        url: '/threat-intel',
        badge: ioc.verdict,
      });
    });

    rules.forEach((r) => {
      results.push({
        id: r.id,
        category: 'RULE',
        title: `${r.id}: ${r.name}`,
        subtitle: `Tactic: ${r.mitreTactic} | Status: ${r.status}`,
        url: '/rules',
        severity: r.severity as any,
      });
    });

    return results;
  }
}
