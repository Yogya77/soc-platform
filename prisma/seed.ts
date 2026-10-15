import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  mockAssets,
  mockDetectionRules,
  mockEvents,
  mockThreatIntel,
  mockIncidents,
  mockAlerts,
  mockAiInvestigation,
  mockInvestigationReport,
  initialAuditLogs,
} from '../src/services/mock.data';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SOC Platform database seed...');

  // 1. Seed Users (with secure bcrypt hashes)
  console.log('👤 Seeding default analyst and admin accounts...');
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Analyst@2026!', salt);
  const adminPasswordHash = await bcrypt.hash('Admin@2026!', salt);
  const auditorPasswordHash = await bcrypt.hash('Auditor@2026!', salt);

  const users = [
    {
      id: 'USR-001',
      email: 'admin@soc.internal',
      name: 'SOC Administrator',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      department: 'SOC Engineering',
    },
    {
      id: 'USR-002',
      email: 'sarah.jenkins@soc.internal',
      name: 'Sarah Jenkins',
      passwordHash: defaultPasswordHash,
      role: Role.LEAD_ANALYST,
      department: 'Incident Response',
    },
    {
      id: 'USR-003',
      email: 'marcus.vance@soc.internal',
      name: 'Marcus Vance',
      passwordHash: defaultPasswordHash,
      role: Role.TIER2_ANALYST,
      department: 'Threat Operations',
    },
    {
      id: 'USR-004',
      email: 'auditor@soc.internal',
      name: 'Compliance Auditor',
      passwordHash: auditorPasswordHash,
      role: Role.READ_ONLY,
      department: 'Internal Audit',
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, department: u.department },
      create: u,
    });
  }

  // 2. Seed Assets
  console.log('💻 Seeding asset inventory & host endpoints...');
  for (const asset of mockAssets) {
    await prisma.asset.upsert({
      where: { id: asset.id },
      update: {
        health: asset.health,
        riskScore: asset.riskScore,
        openAlertCount: asset.openAlertCount,
        incidentCount: asset.incidentCount,
        isolationStatus: asset.isolationStatus,
        lastSeen: new Date(asset.lastSeen),
      },
      create: {
        id: asset.id,
        hostname: asset.hostname,
        ipAddress: asset.ipAddress,
        macAddress: asset.macAddress,
        operatingSystem: asset.operatingSystem,
        role: asset.role,
        health: asset.health,
        riskScore: asset.riskScore,
        openAlertCount: asset.openAlertCount,
        incidentCount: asset.incidentCount,
        lastSeen: new Date(asset.lastSeen),
        assignedUser: asset.assignedUser,
        department: asset.department,
        isolationStatus: asset.isolationStatus,
      },
    });
  }

  // 3. Seed Detection Rules
  console.log('📜 Seeding Sigma & SIEM detection rules...');
  for (const rule of mockDetectionRules) {
    await prisma.detectionRule.upsert({
      where: { id: rule.id },
      update: {
        status: rule.status,
        triggerCount: rule.triggerCount,
        lastTriggered: rule.lastTriggered ? new Date(rule.lastTriggered) : null,
      },
      create: {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        severity: rule.severity,
        mitreTactic: rule.mitreTactic,
        mitreTechniqueId: rule.mitreTechniqueId,
        mitreTechniqueName: rule.mitreTechniqueName,
        queryLogic: rule.queryLogic,
        sigmaYaml: rule.sigmaYaml,
        exampleMatchingEvent: rule.exampleMatchingEvent,
        eventSources: rule.eventSources,
        status: rule.status,
        lastTriggered: rule.lastTriggered ? new Date(rule.lastTriggered) : null,
        triggerCount: rule.triggerCount,
        author: rule.author,
        falsePositiveRate: rule.falsePositiveRate,
      },
    });
  }

  // 4. Seed Windows Security Events
  console.log('🛡️ Seeding Windows security event telemetry...');
  for (const evt of mockEvents) {
    // Find matching asset
    const matchingAsset = mockAssets.find((a) => a.hostname.toLowerCase() === evt.hostname.toLowerCase());
    await prisma.securityEvent.upsert({
      where: { id: evt.id },
      update: {
        timestamp: new Date(evt.timestamp),
        severity: evt.severity,
        status: evt.status,
      },
      create: {
        id: evt.id,
        timestamp: new Date(evt.timestamp),
        eventId: evt.eventId,
        eventName: evt.eventName,
        hostname: evt.hostname,
        sourceIp: evt.sourceIp,
        destinationIp: evt.destinationIp,
        username: evt.username,
        domain: evt.domain,
        processName: evt.processName,
        processCommandLine: evt.processCommandLine,
        parentProcessName: evt.parentProcessName,
        logonType: evt.logonType,
        provider: evt.provider,
        severity: evt.severity,
        status: evt.status,
        detectionRelevance: evt.detectionRelevance,
        rawXmlOrJson: evt.rawXmlOrJson,
        assetId: matchingAsset ? matchingAsset.id : null,
      },
    });
  }

  // 5. Seed Threat Intelligence Indicators
  console.log('🌐 Seeding Threat Intelligence IOC indicators...');
  for (const ioc of mockThreatIntel) {
    await prisma.threatIndicator.upsert({
      where: { indicator: ioc.indicator },
      update: {
        verdict: ioc.verdict,
        confidenceScore: ioc.confidenceScore,
        lastSeen: new Date(ioc.lastSeen),
      },
      create: {
        id: ioc.id,
        indicator: ioc.indicator,
        type: ioc.type,
        verdict: ioc.verdict,
        confidenceScore: ioc.confidenceScore,
        sourceLabel: ioc.sourceLabel,
        isSimulated: ioc.isSimulated,
        threatActor: ioc.threatActor,
        malwareFamily: ioc.malwareFamily,
        firstSeen: new Date(ioc.firstSeen),
        lastSeen: new Date(ioc.lastSeen),
        associatedHostnames: ioc.associatedHostnames,
        associatedEventIds: ioc.associatedEventIds,
        associatedAlertIds: ioc.associatedAlertIds,
        associatedIncidentIds: ioc.associatedIncidentIds,
        mitreTechniques: ioc.mitreTechniques ? (ioc.mitreTechniques as any) : undefined,
        tags: ioc.tags,
        description: ioc.description,
      },
    });
  }

  // 6. Seed Incidents & Relationships
  console.log('🚨 Seeding active security incidents...');
  for (const inc of mockIncidents) {
    await prisma.incident.upsert({
      where: { id: inc.id },
      update: {
        title: inc.title,
        severity: inc.severity,
        riskScore: inc.riskScore,
        status: inc.status,
        assignedAnalyst: inc.assignedAnalyst,
        updatedAt: new Date(inc.updatedAt),
      },
      create: {
        id: inc.id,
        title: inc.title,
        severity: inc.severity,
        riskScore: inc.riskScore,
        status: inc.status,
        assignedAnalyst: inc.assignedAnalyst,
        rootCauseHypothesis: inc.rootCauseHypothesis,
        mitreTactics: inc.mitreTactics,
        isAiAnalyzed: inc.isAiAnalyzed ?? true,
        createdAt: new Date(inc.createdAt),
        updatedAt: new Date(inc.updatedAt),
      },
    });

    // Seed affected asset links
    for (const assetId of inc.affectedAssetIds) {
      await prisma.incidentAsset.upsert({
        where: { incidentId_assetId: { incidentId: inc.id, assetId } },
        update: {},
        create: {
          incidentId: inc.id,
          assetId,
        },
      });
    }

    // Seed timeline
    for (const tl of inc.timeline) {
      await prisma.incidentTimeline.upsert({
        where: { id: tl.id },
        update: {},
        create: {
          id: tl.id,
          incidentId: inc.id,
          timestamp: new Date(tl.timestamp),
          stage: tl.stage,
          title: tl.title,
          description: tl.description,
          sourceType: tl.sourceType,
          referenceId: tl.referenceId,
        },
      });
    }

    // Seed notes
    if (inc.notes) {
      for (const note of inc.notes) {
        await prisma.incidentNote.upsert({
          where: { id: note.id },
          update: {},
          create: {
            id: note.id,
            incidentId: inc.id,
            timestamp: new Date(note.timestamp),
            author: note.author,
            content: note.content,
          },
        });
      }
    }
  }

  // 7. Seed Alerts
  console.log('⚠️ Seeding security alerts & incident links...');
  for (const alert of mockAlerts) {
    await prisma.alert.upsert({
      where: { id: alert.id },
      update: {
        status: alert.status,
        confidenceScore: alert.confidenceScore,
        incidentId: alert.incidentId || null,
      },
      create: {
        id: alert.id,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        status: alert.status,
        assetId: alert.assetId,
        hostname: alert.hostname,
        sourceIp: alert.sourceIp,
        destinationIp: alert.destinationIp,
        username: alert.username,
        ruleId: alert.ruleId,
        ruleName: alert.ruleName,
        mitreTechniqueId: alert.mitreTechniqueId,
        mitreTechniqueName: alert.mitreTechniqueName,
        mitreTactic: alert.mitreTactic,
        whyTriggered: alert.whyTriggered,
        associatedIocValues: alert.associatedIocValues || [],
        confidenceScore: alert.confidenceScore,
        detectedAt: new Date(alert.detectedAt),
        evidence: alert.evidence as any,
        incidentId: alert.incidentId || null,
      },
    });
  }

  // 8. Seed AI Investigation & Recommendations
  console.log('🤖 Seeding AI Analyst investigation & playbooks...');
  const aiInv = await prisma.aIInvestigation.upsert({
    where: { incidentId: mockAiInvestigation.incidentId },
    update: {
      status: mockAiInvestigation.status,
      currentStepIndex: mockAiInvestigation.currentStepIndex,
    },
    create: {
      incidentId: mockAiInvestigation.incidentId,
      status: mockAiInvestigation.status,
      currentStepIndex: mockAiInvestigation.currentStepIndex,
      steps: mockAiInvestigation.steps as any,
      observedEvidence: mockAiInvestigation.observedEvidence as any,
      simulatedAiAssessment: mockAiInvestigation.simulatedAiAssessment as any,
      investigativeNextSteps: mockAiInvestigation.recommendations.investigativeNextSteps,
      longTermRemediation: mockAiInvestigation.recommendations.longTermRemediation,
      completedAt: new Date(),
    },
  });

  for (const rec of mockAiInvestigation.recommendations.containmentActions) {
    await prisma.aIRecommendation.upsert({
      where: { id: rec.id },
      update: {
        status: rec.status,
        executedAt: rec.executedAt ? new Date(rec.executedAt) : null,
      },
      create: {
        id: rec.id,
        investigationId: aiInv.id,
        action: rec.action,
        severity: rec.severity,
        target: rec.target,
        reason: rec.reason,
        priority: rec.priority,
        status: rec.status,
        isAutomatedAvailable: rec.isAutomatedAvailable,
        executedAt: rec.executedAt ? new Date(rec.executedAt) : null,
      },
    });
  }

  // 9. Seed Investigation Report
  console.log('📄 Seeding formal investigation reports...');
  await prisma.investigationReport.upsert({
    where: { incidentId: mockInvestigationReport.incidentId },
    update: {
      title: mockInvestigationReport.title,
      severity: mockInvestigationReport.severity,
      executiveSummary: mockInvestigationReport.executiveSummary,
    },
    create: {
      id: mockInvestigationReport.id,
      incidentId: mockInvestigationReport.incidentId,
      generatedAt: new Date(mockInvestigationReport.generatedAt),
      classification: mockInvestigationReport.classification,
      title: mockInvestigationReport.title,
      severity: mockInvestigationReport.severity,
      executiveSummary: mockInvestigationReport.executiveSummary,
      observedEvidence: mockInvestigationReport.observedEvidence as any,
      simulatedAiAssessment: mockInvestigationReport.simulatedAiAssessment as any,
      recommendedActions: mockInvestigationReport.recommendedActions as any,
      analystActionHistory: mockInvestigationReport.analystActionHistory as any,
    },
  });

  // 10. Seed Audit Logs
  console.log('📋 Seeding forensic analyst audit logs...');
  for (const log of initialAuditLogs) {
    await prisma.auditLog.upsert({
      where: { id: log.id },
      update: {},
      create: {
        id: log.id,
        timestamp: new Date(log.timestamp),
        analyst: log.analyst,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        details: log.details,
      },
    });
  }

  // 11. Seed System Settings
  console.log('⚙️ Seeding SOC system settings...');
  await prisma.systemSetting.upsert({
    where: { key: 'telemetry_pipeline' },
    update: {},
    create: {
      key: 'telemetry_pipeline',
      value: {
        collectorActive: true,
        batchSize: 250,
        flushIntervalMs: 5000,
        syslogPort: 514,
        wefPort: 5985,
      },
      description: 'Windows Security Event Log and Sysmon collector streaming parameters',
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'ai_engine_config' },
    update: {},
    create: {
      key: 'ai_engine_config',
      value: {
        provider: 'SIMULATED_DEMO',
        model: 'gemini-1.5-pro-soc-analyst',
        confidenceThreshold: 85,
        autoQuarantineCritical: false,
      },
      description: 'AI Analyst reasoning engine and automated containment safeguards',
    },
  });

  console.log('✅ SOC Platform database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
