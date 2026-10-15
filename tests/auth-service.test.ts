import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../src/server/services/auth.service';
import { clearRateLimitStore } from '../src/server/auth-rate-limit';
import { verifySessionToken } from '../src/server/session';
import { prisma } from '../src/lib/prisma';

describe('Stage 4: Authentication Service & Rate Limiting', () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  test('authenticates valid credentials for default seeded accounts', async () => {
    const result = await AuthService.login('sarah.jenkins@soc.internal', 'Analyst@2026!', '127.0.0.1');
    assert.equal(result.success, true);
    if (result.success) {
      assert.ok(result.token);
      assert.equal(result.user.email, 'sarah.jenkins@soc.internal');
      assert.equal(result.user.role, 'LEAD_ANALYST');
      assert.equal(result.payload.name, 'Sarah Jenkins');

      const verified = verifySessionToken(result.token);
      assert.equal(verified.valid, true);
    }
  });

  test('authenticates Administrator account with ADMIN role', async () => {
    const result = await AuthService.login('admin@soc.internal', 'Admin@2026!', '127.0.0.1');
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.user.role, 'ADMIN');
    }
  });

  test('authenticates Auditor account with READ_ONLY role', async () => {
    const result = await AuthService.login('auditor@soc.internal', 'Auditor@2026!', '127.0.0.1');
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.user.role, 'READ_ONLY');
    }
  });

  test('rejects incorrect password without account enumeration', async () => {
    const result = await AuthService.login('sarah.jenkins@soc.internal', 'WrongPassword123!', '127.0.0.1');
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.code, 'INVALID_CREDENTIALS');
      assert.equal(result.error, 'Invalid email or password.');
    }
  });

  test('rejects non-existent email with identical error message', async () => {
    const result = await AuthService.login('nonexistent.user@soc.internal', 'RandomPassword!', '127.0.0.1');
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.code, 'INVALID_CREDENTIALS');
      assert.equal(result.error, 'Invalid email or password.');
    }
  });

  test('strictly rejects offline fallback accounts in production environment', async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalFindUnique = prisma.user.findUnique;
    try {
      (process.env as any).NODE_ENV = 'production';
      // Genuinely simulate database unavailability to verify fallback rejection in production
      (prisma.user as any).findUnique = async () => {
        throw new Error("Can't reach database server at `localhost:5432`");
      };

      const result = await AuthService.login('sarah.jenkins@soc.internal', 'Analyst@2026!', '127.0.0.1');
      assert.equal(result.success, false);
      if (!result.success) {
        assert.equal(result.code, 'INVALID_CREDENTIALS');
      }
    } finally {
      (prisma.user as any).findUnique = originalFindUnique;
      (process.env as any).NODE_ENV = originalEnv;
    }
  });

  test('rate limits after 5 failed login attempts and sets lockout', async () => {
    const testIp = '198.51.100.99';
    const email = 'target.user@soc.internal';

    // 4 failed attempts should be allowed to retry
    for (let i = 0; i < 4; i++) {
      const res = await AuthService.login(email, 'bad_pass', testIp);
      assert.equal(res.success, false);
      if (!res.success) {
        assert.equal(res.code, 'INVALID_CREDENTIALS');
      }
    }

    // 5th failed attempt triggers RATE_LIMITED lockout
    const fifth = await AuthService.login(email, 'bad_pass', testIp);
    assert.equal(fifth.success, false);
    if (!fifth.success) {
      assert.equal(fifth.code, 'RATE_LIMITED');
      assert.ok(fifth.retryAfterSeconds && fifth.retryAfterSeconds > 0);
    }

    // Subsequent attempt is blocked immediately
    const blocked = await AuthService.login(email, 'bad_pass', testIp);
    assert.equal(blocked.success, false);
    if (!blocked.success) {
      assert.equal(blocked.code, 'RATE_LIMITED');
    }
  });

  test('logout revokes the active session token', async () => {
    const loginRes = await AuthService.login('sarah.jenkins@soc.internal', 'Analyst@2026!');
    assert.equal(loginRes.success, true);
    if (loginRes.success) {
      assert.equal(verifySessionToken(loginRes.token).valid, true);

      await AuthService.logout(loginRes.token, loginRes.user);

      const check = verifySessionToken(loginRes.token);
      assert.equal(check.valid, false);
      if (!check.valid) {
        assert.equal(check.reason, 'REVOKED');
      }
    }
  });
});
