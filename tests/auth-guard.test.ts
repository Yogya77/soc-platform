import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { requireDevOrAuth } from '../src/server/auth-guard';

describe('Stage 3: Server Authorization Guard', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
  });

  test('allows dev bypass in development mode with simulated analyst context', () => {
    (process.env as any).NODE_ENV = 'development';
    const req = new NextRequest('http://localhost:3000/api/alerts/ALT-001/status', {
      method: 'PATCH',
    });

    const res = requireDevOrAuth(req, 'write:alerts');
    assert.equal(res.authorized, true);
    if (res.authorized) {
      assert.equal(res.auth.userId, 'DEV-ANALYST-001');
      assert.equal(res.auth.name, 'Sarah Jenkins (Lead IR - Dev)');
      assert.equal(res.auth.isDevBypass, true);
    }
  });

  test('accepts valid bearer token in development and production', () => {
    (process.env as any).NODE_ENV = 'production';
    const req = new NextRequest('http://localhost:3000/api/incidents', {
      method: 'POST',
      headers: {
        authorization: 'Bearer dev_valid_token_2026',
      },
    });

    const res = requireDevOrAuth(req, 'write:incidents');
    assert.equal(res.authorized, true);
    if (res.authorized) {
      assert.equal(res.auth.role, 'ADMIN');
      assert.equal(res.auth.isDevBypass, false);
    }
  });

  test('rejects unauthenticated requests in production with HTTP 401', async () => {
    (process.env as any).NODE_ENV = 'production';
    const req = new NextRequest('http://localhost:3000/api/alerts/ALT-001/escalate', {
      method: 'POST',
    });

    const res = requireDevOrAuth(req, 'write:alerts');
    assert.equal(res.authorized, false);
    if (!res.authorized) {
      assert.equal(res.response.status, 401);
      const json = await res.response.json();
      assert.equal(json.code, 'UNAUTHORIZED');
      assert.match(json.error, /Authentication required/);
    }
  });

  test('rejects invalid bearer token in production with HTTP 401', async () => {
    (process.env as any).NODE_ENV = 'production';
    const req = new NextRequest('http://localhost:3000/api/assets/AST-102/isolation', {
      method: 'POST',
      headers: {
        authorization: 'Bearer invalid_malicious_token',
      },
    });

    const res = requireDevOrAuth(req, 'write:assets');
    assert.equal(res.authorized, false);
    if (!res.authorized) {
      assert.equal(res.response.status, 401);
    }
  });
});
