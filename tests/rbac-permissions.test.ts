import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { requireAuth, hasPermission } from '../src/server/auth-guard';
import { signSessionToken, revokeSession, SESSION_COOKIE_NAME } from '../src/server/session';

describe('Stage 4: Server-Side RBAC & Direct API Authorization', () => {
  const adminToken = signSessionToken({
    userId: 'USR-001',
    email: 'admin@soc.internal',
    name: 'SOC Administrator',
    role: 'ADMIN',
  }).token;

  const analystToken = signSessionToken({
    userId: 'USR-002',
    email: 'sarah.jenkins@soc.internal',
    name: 'Sarah Jenkins',
    role: 'LEAD_ANALYST',
  }).token;

  const tier1Token = signSessionToken({
    userId: 'USR-003',
    email: 'junior.analyst@soc.internal',
    name: 'Junior Analyst',
    role: 'TIER1_ANALYST',
  }).token;

  const viewerToken = signSessionToken({
    userId: 'USR-004',
    email: 'auditor@soc.internal',
    name: 'Compliance Auditor',
    role: 'READ_ONLY',
  }).token;

  test('denies access by default when no session cookie or token is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/incidents', {
      method: 'POST',
    });

    const res = requireAuth(req, 'write:incidents');
    assert.equal(res.authorized, false);
    if (!res.authorized) {
      assert.equal(res.response.status, 401);
      const json = await res.response.json();
      assert.equal(json.code, 'UNAUTHORIZED');
      assert.match(json.error, /Authentication required/);
    }
  });

  test('authenticates requests via HttpOnly cookie', () => {
    const req = new NextRequest('http://localhost:3000/api/incidents', {
      method: 'POST',
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${analystToken}`,
      },
    });

    const res = requireAuth(req, 'write:incidents');
    assert.equal(res.authorized, true);
    if (res.authorized) {
      assert.equal(res.auth.userId, 'USR-002');
      assert.equal(res.auth.name, 'Sarah Jenkins');
      assert.equal(res.auth.role, 'LEAD_ANALYST');
    }
  });

  test('authenticates requests via Authorization Bearer header', () => {
    const req = new NextRequest('http://localhost:3000/api/alerts/ALT-001/status', {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${analystToken}`,
      },
    });

    const res = requireAuth(req, 'write:alerts');
    assert.equal(res.authorized, true);
    if (res.authorized) {
      assert.equal(res.auth.role, 'LEAD_ANALYST');
    }
  });

  test('rejects expired session tokens with HTTP 401 and SESSION_EXPIRED code', async () => {
    const expiredToken = signSessionToken(
      {
        userId: 'USR-002',
        email: 'sarah.jenkins@soc.internal',
        name: 'Sarah Jenkins',
        role: 'LEAD_ANALYST',
      },
      -10 // Expired
    ).token;

    const req = new NextRequest('http://localhost:3000/api/incidents', {
      headers: { authorization: `Bearer ${expiredToken}` },
    });

    const res = requireAuth(req, 'write:incidents');
    assert.equal(res.authorized, false);
    if (!res.authorized) {
      assert.equal(res.response.status, 401);
      const json = await res.response.json();
      assert.equal(json.code, 'SESSION_EXPIRED');
    }
  });

  test('rejects revoked sessions with HTTP 401 and SESSION_REVOKED code', async () => {
    const { token, payload } = signSessionToken({
      userId: 'USR-002',
      email: 'sarah.jenkins@soc.internal',
      name: 'Sarah Jenkins',
      role: 'LEAD_ANALYST',
    });

    revokeSession(payload.sessionId);

    const req = new NextRequest('http://localhost:3000/api/incidents', {
      headers: { authorization: `Bearer ${token}` },
    });

    const res = requireAuth(req, 'write:incidents');
    assert.equal(res.authorized, false);
    if (!res.authorized) {
      assert.equal(res.response.status, 401);
      const json = await res.response.json();
      assert.equal(json.code, 'SESSION_REVOKED');
    }
  });

  test('ADMIN role is granted all permissions including write:settings', () => {
    assert.equal(hasPermission('ADMIN', 'write:settings'), true);
    assert.equal(hasPermission('ADMIN', 'write:rules'), true);
    assert.equal(hasPermission('ADMIN', 'write:assets'), true);
    assert.equal(hasPermission('ADMIN', 'write:incidents'), true);
    assert.equal(hasPermission('ADMIN', 'write:alerts'), true);

    const req = new NextRequest('http://localhost:3000/api/system/settings', {
      method: 'POST',
      headers: { authorization: `Bearer ${adminToken}` },
    });

    const res = requireAuth(req, 'write:settings');
    assert.equal(res.authorized, true);
  });

  test('LEAD_ANALYST is granted operational write permissions but FORBIDDEN from write:settings', async () => {
    assert.equal(hasPermission('LEAD_ANALYST', 'write:alerts'), true);
    assert.equal(hasPermission('LEAD_ANALYST', 'write:incidents'), true);
    assert.equal(hasPermission('LEAD_ANALYST', 'write:assets'), true);
    assert.equal(hasPermission('LEAD_ANALYST', 'write:rules'), true);
    assert.equal(hasPermission('LEAD_ANALYST', 'write:settings'), false);

    const req = new NextRequest('http://localhost:3000/api/system/settings', {
      method: 'POST',
      headers: { authorization: `Bearer ${analystToken}` },
    });

    const res = requireAuth(req, 'write:settings');
    assert.equal(res.authorized, false);
    if (!res.authorized) {
      assert.equal(res.response.status, 403);
      const json = await res.response.json();
      assert.equal(json.code, 'FORBIDDEN');
      assert.match(json.error, /lacks the required 'write:settings' permission/);
    }
  });

  test('TIER1_ANALYST is FORBIDDEN from asset isolation and rule modifications', async () => {
    assert.equal(hasPermission('TIER1_ANALYST', 'write:alerts'), true);
    assert.equal(hasPermission('TIER1_ANALYST', 'write:incidents'), true);
    assert.equal(hasPermission('TIER1_ANALYST', 'write:assets'), false);
    assert.equal(hasPermission('TIER1_ANALYST', 'write:rules'), false);

    const req = new NextRequest('http://localhost:3000/api/assets/AST-102/isolation', {
      method: 'POST',
      headers: { authorization: `Bearer ${tier1Token}` },
    });

    const res = requireAuth(req, 'write:assets');
    assert.equal(res.authorized, false);
    if (!res.authorized) {
      assert.equal(res.response.status, 403);
      const json = await res.response.json();
      assert.equal(json.code, 'FORBIDDEN');
    }
  });

  test('READ_ONLY Viewer role is FORBIDDEN from all mutation actions', async () => {
    assert.equal(hasPermission('READ_ONLY', 'read:security_data'), true);
    assert.equal(hasPermission('READ_ONLY', 'write:alerts'), false);
    assert.equal(hasPermission('READ_ONLY', 'write:incidents'), false);
    assert.equal(hasPermission('READ_ONLY', 'write:assets'), false);
    assert.equal(hasPermission('READ_ONLY', 'write:rules'), false);
    assert.equal(hasPermission('READ_ONLY', 'write:settings'), false);
    assert.equal(hasPermission('READ_ONLY', 'write:audit_logs'), false);

    const writePermissions = [
      'write:alerts',
      'write:incidents',
      'write:assets',
      'write:rules',
      'write:settings',
      'write:audit_logs',
    ] as const;

    for (const perm of writePermissions) {
      const req = new NextRequest('http://localhost:3000/api/protected', {
        headers: { authorization: `Bearer ${viewerToken}` },
      });
      const res = requireAuth(req, perm);
      assert.equal(res.authorized, false);
      if (!res.authorized) {
        assert.equal(res.response.status, 403);
      }
    }
  });

  test('ignores client spoofing headers and strictly uses verified session identity', () => {
    const req = new NextRequest('http://localhost:3000/api/alerts/ALT-001/status', {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${analystToken}`,
        'x-analyst-name': 'Attacker Injected Identity',
        'x-analyst-role': 'ADMIN',
      },
    });

    const res = requireAuth(req, 'write:alerts');
    assert.equal(res.authorized, true);
    if (res.authorized) {
      // Must NOT take 'Attacker Injected Identity' or 'ADMIN'
      assert.equal(res.auth.name, 'Sarah Jenkins');
      assert.equal(res.auth.role, 'LEAD_ANALYST');
    }
  });

  test('denies unauthenticated requests to sensitive read endpoints with HTTP 401', () => {
    const sensitiveReadEndpoints = [
      '/api/audit-logs',
      '/api/system/settings',
      '/api/incidents/INC-2026-0881/report',
      '/api/incidents/INC-2026-0881/ai-investigate',
      '/api/alerts',
      '/api/alerts/ALT-001',
      '/api/incidents',
      '/api/incidents/INC-2026-0881',
      '/api/assets',
      '/api/assets/AST-101',
      '/api/events',
      '/api/events/EVT-1001',
      '/api/rules',
      '/api/rules/RUL-001',
      '/api/threat-intel',
      '/api/threat-intel/lookup',
      '/api/dashboard/stats',
      '/api/dashboard/activity-chart',
      '/api/search',
    ];

    for (const endpoint of sensitiveReadEndpoints) {
      const req = new NextRequest(`http://localhost:3000${endpoint}`, { method: 'GET' });
      const res = requireAuth(req, 'read:security_data');
      assert.equal(res.authorized, false, `Endpoint ${endpoint} must require authentication`);
      if (!res.authorized) {
        assert.equal(res.response.status, 401);
      }
    }
  });

  test('allows authenticated users across all roles to access read:security_data', () => {
    const roles = [
      { name: 'Admin', token: adminToken },
      { name: 'Lead Analyst', token: analystToken },
      { name: 'Tier 1 Analyst', token: tier1Token },
      { name: 'Read-only Viewer', token: viewerToken },
    ];

    for (const { name, token } of roles) {
      const req = new NextRequest('http://localhost:3000/api/incidents', {
        method: 'GET',
        headers: { authorization: `Bearer ${token}` },
      });
      const res = requireAuth(req, 'read:security_data');
      assert.equal(res.authorized, true, `${name} must be allowed to read security data`);
    }
  });

  test('public health endpoint structure reveals no secrets or credentials', async () => {
    // Import health handler directly to verify payload privacy
    const { GET } = await import('../src/app/api/system/health/route');
    const response = await GET();
    assert.equal(response.status, 200);

    const json = await response.json();
    assert.ok(json.apiStatus);
    assert.ok(json.collectorStatus);
    assert.ok(json.databaseStatus);
    assert.ok(json.aiEngineStatus);

    // Verify absence of sensitive internal details
    assert.equal(json.password, undefined);
    assert.equal(json.secret, undefined);
    assert.equal(json.DATABASE_URL, undefined);
    assert.equal(json.JWT_SECRET, undefined);
  });
});
