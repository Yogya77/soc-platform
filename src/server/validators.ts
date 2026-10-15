import { z } from 'zod';

export const alertStatusSchema = z.object({
  status: z.enum(['NEW', 'INVESTIGATING', 'ESCALATED', 'DISMISSED', 'RESOLVED']),
  note: z.string().max(1000).optional(),
});

export const alertEscalateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']).optional(),
  riskScore: z.number().int().min(0).max(100).optional(),
  assignedAnalyst: z.string().min(2).max(100).optional(),
  description: z.string().max(2000).optional(),
});

export const alertLinkSchema = z.object({
  incidentId: z.string().min(3).max(50),
});

export const incidentCreateSchema = z.object({
  title: z.string().min(3).max(200),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('HIGH'),
  riskScore: z.number().int().min(0).max(100).default(50),
  assignedAnalyst: z.string().min(2).max(100).default('Sarah Jenkins (Lead IR)'),
  rootCauseHypothesis: z.string().max(2000).default('Analyst-initiated investigation.'),
  mitreTactics: z.array(z.string()).default(['Execution']),
  alertIds: z.array(z.string()).default([]),
  affectedAssetIds: z.array(z.string()).default([]),
});

export const incidentStatusSchema = z.object({
  status: z.enum(['OPEN', 'INVESTIGATING', 'CONTAINED', 'ERADICATED', 'CLOSED']),
});

export const incidentSeveritySchema = z.object({
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
});

export const incidentAssignSchema = z.object({
  analyst: z.string().min(2).max(100),
});

export const incidentNoteSchema = z.object({
  author: z.string().min(2).max(100).default('Sarah Jenkins'),
  content: z.string().min(1).max(2000),
});

export const assetIsolationSchema = z.object({
  isolate: z.boolean(),
});

export const ruleStatusSchema = z.object({
  enabled: z.boolean(),
});

export const recommendationStatusSchema = z.object({
  status: z.enum(['PROPOSED', 'APPROVED', 'REJECTED', 'EXECUTED']),
});

export const auditLogCreateSchema = z.object({
  analyst: z.string().min(2).max(100),
  action: z.string().min(2).max(100),
  targetType: z.enum(['ALERT', 'INCIDENT', 'ASSET', 'RULE', 'AI_INVESTIGATION', 'REPORT']),
  targetId: z.string().min(1).max(100),
  details: z.string().min(1).max(2000),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required').max(200),
});
