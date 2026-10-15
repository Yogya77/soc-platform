import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  alertStatusSchema,
  alertEscalateSchema,
  alertLinkSchema,
  incidentCreateSchema,
  incidentStatusSchema,
  incidentSeveritySchema,
  incidentAssignSchema,
  incidentNoteSchema,
  assetIsolationSchema,
  ruleStatusSchema,
  recommendationStatusSchema,
  auditLogCreateSchema,
} from '../src/server/validators';

describe('Stage 3: Server API Request Validators', () => {
  test('alertStatusSchema accepts valid status and optional note', () => {
    const valid = alertStatusSchema.safeParse({ status: 'INVESTIGATING', note: 'Investigating anomalous logon' });
    assert.equal(valid.success, true);
    if (valid.success) {
      assert.equal(valid.data.status, 'INVESTIGATING');
      assert.equal(valid.data.note, 'Investigating anomalous logon');
    }
  });

  test('alertStatusSchema rejects invalid status', () => {
    const invalid = alertStatusSchema.safeParse({ status: 'UNKNOWN_STATUS' });
    assert.equal(invalid.success, false);
  });

  test('alertEscalateSchema parses optional title and default fields', () => {
    const valid = alertEscalateSchema.safeParse({
      title: 'Privilege Escalation Detected on DC-01',
      severity: 'CRITICAL',
    });
    assert.equal(valid.success, true);
    if (valid.success) {
      assert.equal(valid.data.title, 'Privilege Escalation Detected on DC-01');
      assert.equal(valid.data.severity, 'CRITICAL');
    }
  });

  test('alertLinkSchema requires incidentId of valid length', () => {
    const valid = alertLinkSchema.safeParse({ incidentId: 'INC-2026-0881' });
    assert.equal(valid.success, true);

    const invalid = alertLinkSchema.safeParse({ incidentId: '' });
    assert.equal(invalid.success, false);
  });

  test('incidentCreateSchema applies secure defaults', () => {
    const valid = incidentCreateSchema.safeParse({
      title: 'Suspicious Kerberoasting Activity',
    });
    assert.equal(valid.success, true);
    if (valid.success) {
      assert.equal(valid.data.title, 'Suspicious Kerberoasting Activity');
      assert.equal(valid.data.severity, 'HIGH');
      assert.equal(valid.data.riskScore, 50);
      assert.equal(valid.data.assignedAnalyst, 'Sarah Jenkins (Lead IR)');
    }
  });

  test('incidentStatusSchema validates lifecycle transitions', () => {
    const statuses = ['OPEN', 'INVESTIGATING', 'CONTAINED', 'ERADICATED', 'CLOSED'];
    for (const s of statuses) {
      const res = incidentStatusSchema.safeParse({ status: s });
      assert.equal(res.success, true, `Status ${s} should be valid`);
    }

    const invalid = incidentStatusSchema.safeParse({ status: 'ARCHIVED' });
    assert.equal(invalid.success, false);
  });

  test('assetIsolationSchema validates boolean isolate flag', () => {
    assert.equal(assetIsolationSchema.safeParse({ isolate: true }).success, true);
    assert.equal(assetIsolationSchema.safeParse({ isolate: false }).success, true);
    assert.equal(assetIsolationSchema.safeParse({ isolate: 'yes' }).success, false);
  });

  test('ruleStatusSchema validates boolean enabled flag', () => {
    assert.equal(ruleStatusSchema.safeParse({ enabled: true }).success, true);
    assert.equal(ruleStatusSchema.safeParse({ enabled: false }).success, true);
    assert.equal(ruleStatusSchema.safeParse({ enabled: 1 }).success, false);
  });

  test('recommendationStatusSchema validates recommendation lifecycles', () => {
    const valid = ['PROPOSED', 'APPROVED', 'REJECTED', 'EXECUTED'];
    for (const status of valid) {
      assert.equal(recommendationStatusSchema.safeParse({ status }).success, true);
    }
    assert.equal(recommendationStatusSchema.safeParse({ status: 'DEFERRED' }).success, false);
  });

  test('auditLogCreateSchema validates strict target types', () => {
    const valid = auditLogCreateSchema.safeParse({
      analyst: 'Sarah Jenkins',
      action: 'HOST_ISOLATION_REQUEST',
      targetType: 'ASSET',
      targetId: 'AST-102',
      details: 'Isolated workstation WKS-FIN-04 due to beaconing detection',
    });
    assert.equal(valid.success, true);

    const invalid = auditLogCreateSchema.safeParse({
      analyst: 'Sarah Jenkins',
      action: 'HOST_ISOLATION_REQUEST',
      targetType: 'NETWORK_SWITCH', // Not allowed targetType
      targetId: 'SW-01',
      details: 'testing',
    });
    assert.equal(invalid.success, false);
  });
});
