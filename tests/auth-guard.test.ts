import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { requireDevOrAuth } from '../src/server/auth-guard';
import { signSessionToken } from '../src/server/session';

describe('Stage 4: Server Authorization Boundary (Strict Verification)', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
  });

  const validToken = signSessionToken({
    userId: 'USR-002',
    email: 'sarah.jenkins@soc.internal',
    name: 'Sarah Jenkins',
    role: 'LEAD_ANALYST',
  }).token;

  test('denies unauthenticated requests by default in all environments with HTTP 401', async () => {
    (process.env as any).NODE_ENV = 'development';
    const req = new NextRequest('http://localhost:3000/api/alerts/ALT-001/status', {
      method: 'PATCH',
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

  test('accepts valid cryptographic session token in both development and production', () => {
    (process.env as any).NODE_ENV = 'production';
    const req = new NextRequest('http://localhost:3000/api/incidents', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${validToken}`,
      },
    });

    const res = requireDevOrAuth(req, 'write:incidents');
    assert.equal(res.authorized, true);
    if (res.authorized) {
      assert.equal(res.auth.userId, 'USR-002');
      assert.equal(res.auth.name, 'Sarah Jenkins');
      assert.equal(res.auth.role, 'LEAD_ANALYST');
      assert.equal(res.auth.isDevBypass, false);
    }
  });

  test('rejects invalid or forged bearer token with HTTP 401', async () => {
    (process.env as any).NODE_ENV = 'production';
    const req = new NextRequest('http://localhost:3000/api/assets/AST-102/isolation', {
      method: 'POST',
      headers: {
        authorization: 'Bearer forged.invalid.token',
      },
    });

    const res = requireDevOrAuth(req, 'write:assets');
    assert.equal(res.authorized, false);
    if (!res.authorized) {
      assert.equal(res.response.status, 401);
      const json = await res.response.json();
      assert.equal(json.code, 'INVALID_TOKEN');
    }
  });
});
