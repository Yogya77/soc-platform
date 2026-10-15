-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'LEAD_ANALYST', 'TIER2_ANALYST', 'TIER1_ANALYST', 'READ_ONLY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'TIER2_ANALYST',
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "macAddress" TEXT NOT NULL,
    "operatingSystem" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "health" TEXT NOT NULL DEFAULT 'HEALTHY',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "openAlertCount" INTEGER NOT NULL DEFAULT 0,
    "incidentCount" INTEGER NOT NULL DEFAULT 0,
    "lastSeen" TIMESTAMP(3) NOT NULL,
    "assignedUser" TEXT,
    "department" TEXT,
    "isolationStatus" TEXT NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detection_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "mitreTactic" TEXT NOT NULL,
    "mitreTechniqueId" TEXT NOT NULL,
    "mitreTechniqueName" TEXT NOT NULL,
    "queryLogic" TEXT NOT NULL,
    "sigmaYaml" TEXT,
    "exampleMatchingEvent" TEXT,
    "eventSources" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastTriggered" TIMESTAMP(3),
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "author" TEXT NOT NULL,
    "falsePositiveRate" TEXT NOT NULL DEFAULT 'LOW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detection_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "eventId" INTEGER NOT NULL,
    "eventName" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "sourceIp" TEXT,
    "destinationIp" TEXT,
    "username" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "processName" TEXT,
    "processCommandLine" TEXT,
    "parentProcessName" TEXT,
    "logonType" INTEGER,
    "provider" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "detectionRelevance" TEXT,
    "rawXmlOrJson" JSONB NOT NULL,
    "assetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "assetId" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "sourceIp" TEXT,
    "destinationIp" TEXT,
    "username" TEXT,
    "ruleId" TEXT NOT NULL,
    "ruleName" TEXT NOT NULL,
    "mitreTechniqueId" TEXT,
    "mitreTechniqueName" TEXT,
    "mitreTactic" TEXT,
    "whyTriggered" TEXT,
    "associatedIocValues" TEXT[],
    "confidenceScore" INTEGER NOT NULL DEFAULT 50,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "evidence" JSONB NOT NULL,
    "incidentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL DEFAULT 50,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assignedAnalyst" TEXT NOT NULL,
    "rootCauseHypothesis" TEXT NOT NULL,
    "mitreTactics" TEXT[],
    "isAiAnalyzed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_assets" (
    "incidentId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,

    CONSTRAINT "incident_assets_pkey" PRIMARY KEY ("incidentId","assetId")
);

-- CreateTable
CREATE TABLE "incident_timeline" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "stage" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "referenceId" TEXT,

    CONSTRAINT "incident_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_notes" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "incident_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "threat_indicators" (
    "id" TEXT NOT NULL,
    "indicator" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "confidenceScore" INTEGER NOT NULL DEFAULT 50,
    "sourceLabel" TEXT NOT NULL DEFAULT 'Demo Threat Intelligence Dataset',
    "isSimulated" BOOLEAN NOT NULL DEFAULT true,
    "threatActor" TEXT,
    "malwareFamily" TEXT,
    "firstSeen" TIMESTAMP(3) NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL,
    "associatedHostnames" TEXT[],
    "associatedEventIds" TEXT[],
    "associatedAlertIds" TEXT[],
    "associatedIncidentIds" TEXT[],
    "mitreTechniques" JSONB,
    "tags" TEXT[],
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "threat_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_investigations" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentStepIndex" INTEGER NOT NULL DEFAULT 0,
    "steps" JSONB NOT NULL,
    "observedEvidence" JSONB NOT NULL,
    "simulatedAiAssessment" JSONB NOT NULL,
    "investigativeNextSteps" TEXT[],
    "longTermRemediation" TEXT[],
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_investigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_recommendations" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "isAutomatedAvailable" BOOLEAN NOT NULL DEFAULT true,
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigation_reports" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classification" TEXT NOT NULL DEFAULT 'CONFIDENTIAL // SOC INTERNAL USE',
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "executiveSummary" TEXT NOT NULL,
    "observedEvidence" JSONB NOT NULL,
    "simulatedAiAssessment" JSONB NOT NULL,
    "recommendedActions" JSONB NOT NULL,
    "analystActionHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investigation_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analyst" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "assets_hostname_key" ON "assets"("hostname");

-- CreateIndex
CREATE INDEX "assets_hostname_idx" ON "assets"("hostname");

-- CreateIndex
CREATE INDEX "assets_ipAddress_idx" ON "assets"("ipAddress");

-- CreateIndex
CREATE INDEX "assets_health_idx" ON "assets"("health");

-- CreateIndex
CREATE INDEX "detection_rules_status_idx" ON "detection_rules"("status");

-- CreateIndex
CREATE INDEX "detection_rules_severity_idx" ON "detection_rules"("severity");

-- CreateIndex
CREATE INDEX "detection_rules_mitreTechniqueId_idx" ON "detection_rules"("mitreTechniqueId");

-- CreateIndex
CREATE INDEX "security_events_eventId_idx" ON "security_events"("eventId");

-- CreateIndex
CREATE INDEX "security_events_hostname_idx" ON "security_events"("hostname");

-- CreateIndex
CREATE INDEX "security_events_username_idx" ON "security_events"("username");

-- CreateIndex
CREATE INDEX "security_events_timestamp_idx" ON "security_events"("timestamp");

-- CreateIndex
CREATE INDEX "security_events_severity_idx" ON "security_events"("severity");

-- CreateIndex
CREATE INDEX "alerts_status_idx" ON "alerts"("status");

-- CreateIndex
CREATE INDEX "alerts_severity_idx" ON "alerts"("severity");

-- CreateIndex
CREATE INDEX "alerts_assetId_idx" ON "alerts"("assetId");

-- CreateIndex
CREATE INDEX "alerts_ruleId_idx" ON "alerts"("ruleId");

-- CreateIndex
CREATE INDEX "alerts_incidentId_idx" ON "alerts"("incidentId");

-- CreateIndex
CREATE INDEX "alerts_detectedAt_idx" ON "alerts"("detectedAt");

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- CreateIndex
CREATE INDEX "incidents_severity_idx" ON "incidents"("severity");

-- CreateIndex
CREATE INDEX "incidents_createdAt_idx" ON "incidents"("createdAt");

-- CreateIndex
CREATE INDEX "incident_timeline_incidentId_idx" ON "incident_timeline"("incidentId");

-- CreateIndex
CREATE INDEX "incident_timeline_timestamp_idx" ON "incident_timeline"("timestamp");

-- CreateIndex
CREATE INDEX "incident_notes_incidentId_idx" ON "incident_notes"("incidentId");

-- CreateIndex
CREATE UNIQUE INDEX "threat_indicators_indicator_key" ON "threat_indicators"("indicator");

-- CreateIndex
CREATE INDEX "threat_indicators_indicator_idx" ON "threat_indicators"("indicator");

-- CreateIndex
CREATE INDEX "threat_indicators_type_idx" ON "threat_indicators"("type");

-- CreateIndex
CREATE INDEX "threat_indicators_verdict_idx" ON "threat_indicators"("verdict");

-- CreateIndex
CREATE UNIQUE INDEX "ai_investigations_incidentId_key" ON "ai_investigations"("incidentId");

-- CreateIndex
CREATE INDEX "ai_recommendations_investigationId_idx" ON "ai_recommendations"("investigationId");

-- CreateIndex
CREATE UNIQUE INDEX "investigation_reports_incidentId_key" ON "investigation_reports"("incidentId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_targetType_idx" ON "audit_logs"("targetType");

-- CreateIndex
CREATE INDEX "audit_logs_targetId_idx" ON "audit_logs"("targetId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "detection_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_assets" ADD CONSTRAINT "incident_assets_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_assets" ADD CONSTRAINT "incident_assets_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_timeline" ADD CONSTRAINT "incident_timeline_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_notes" ADD CONSTRAINT "incident_notes_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_investigations" ADD CONSTRAINT "ai_investigations_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "ai_investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigation_reports" ADD CONSTRAINT "investigation_reports_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

