import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  signSessionToken,
  verifySessionToken,
  revokeSession,
  isSessionRevoked,
} from '../src/server/session';

describe('Stage 4: Cryptographic Session Tokens', () => {
  const testUser = {
    userId: 'USR-002',
    email: 'sarah.jenkins@soc.internal',
    name: 'Sarah Jenkins',
    role: 'LEAD_ANALYST' as const,
    department: 'Incident Response',
  };

  test('signs and verifies a valid cryptographic session token', () => {
    const { token, payload } = signSessionToken(testUser, 3600);
    assert.ok(token);
    assert.equal(payload.email, 'sarah.jenkins@soc.internal');
    assert.equal(payload.role, 'LEAD_ANALYST');

    const result = verifySessionToken(token);
    assert.equal(result.valid, true);
    if (result.valid) {
      assert.equal(result.payload.userId, 'USR-002');
      assert.equal(result.payload.name, 'Sarah Jenkins');
      assert.equal(result.payload.iss, 'soc-platform');
      assert.equal(result.payload.aud, 'soc-analysts');
    }
  });

  test('rejects tampered token payloads (signature mismatch)', () => {
    const { token } = signSessionToken(testUser, 3600);
    const parts = token.split('.');
    // Tamper with payload (elevate role to ADMIN)
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...testUser, role: 'ADMIN', iss: 'soc-platform', aud: 'soc-analysts', exp: 9999999999 })
    ).toString('base64url');

    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
    const result = verifySessionToken(tamperedToken);

    assert.equal(result.valid, false);
    if (!result.valid) {
      assert.equal(result.reason, 'INVALID_SIGNATURE');
    }
  });

  test('rejects expired tokens', () => {
    // Generate token with negative duration (expired 10 seconds ago)
    const { token } = signSessionToken(testUser, -10);
    const result = verifySessionToken(token);

    assert.equal(result.valid, false);
    if (!result.valid) {
      assert.equal(result.reason, 'EXPIRED');
    }
  });

  test('rejects revoked session tokens', () => {
    const { token, payload } = signSessionToken(testUser, 3600);
    assert.equal(verifySessionToken(token).valid, true);

    revokeSession(payload.sessionId);
    assert.equal(isSessionRevoked(payload.sessionId), true);

    const result = verifySessionToken(token);
    assert.equal(result.valid, false);
    if (!result.valid) {
      assert.equal(result.reason, 'REVOKED');
    }
  });

  test('rejects malformed token strings', () => {
    assert.equal(verifySessionToken('').valid, false);
    assert.equal(verifySessionToken('invalid.token').valid, false);
    assert.equal(verifySessionToken('not.a.valid.jwt.token').valid, false);
  });
});
