import crypto from 'node:crypto';
import { env } from '@/lib/env';

export type UserRole = 'ADMIN' | 'LEAD_ANALYST' | 'TIER2_ANALYST' | 'TIER1_ANALYST' | 'READ_ONLY';

export interface SessionPayload {
  sessionId: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export const SESSION_COOKIE_NAME = 'soc_session';
export const DEFAULT_SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8 hours
const ISSUER = 'soc-platform';
const AUDIENCE = 'soc-analysts';

// In-memory revocation registry (persists across requests during server runtime)
const revokedSessions = new Set<string>();

function base64UrlEncode(data: string | Buffer): string {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Signs a session token with HMAC-SHA256 and cryptographic integrity
 */
export function signSessionToken(
  user: {
    userId: string;
    email: string;
    name: string;
    role: UserRole;
    department?: string;
  },
  expiresInSeconds = DEFAULT_SESSION_DURATION_SECONDS
): { token: string; payload: SessionPayload } {
  const now = Math.floor(Date.now() / 1000);
  const sessionId = crypto.randomUUID();

  const payload: SessionPayload = {
    sessionId,
    userId: user.userId,
    email: user.email.toLowerCase(),
    name: user.name,
    role: user.role,
    department: user.department,
    iat: now,
    exp: now + expiresInSeconds,
    iss: ISSUER,
    aud: AUDIENCE,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const hmac = crypto.createHmac('sha256', env.JWT_SECRET);
  hmac.update(signatureInput);
  const signature = base64UrlEncode(hmac.digest());

  const token = `${encodedHeader}.${encodedPayload}.${signature}`;
  return { token, payload };
}

/**
 * Cryptographically verifies session token signature, expiration, issuer, and revocation status
 */
export function verifySessionToken(token: string):
  | { valid: true; payload: SessionPayload }
  | { valid: false; reason: 'MALFORMED' | 'INVALID_SIGNATURE' | 'EXPIRED' | 'REVOKED' | 'INVALID_CLAIMS' } {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'MALFORMED' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, reason: 'MALFORMED' };
  }

  const [encodedHeader, encodedPayload, signature] = parts;

  // 1. Verify HMAC-SHA256 signature using timing-safe comparison
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const hmac = crypto.createHmac('sha256', env.JWT_SECRET);
  hmac.update(signatureInput);
  const expectedSignature = base64UrlEncode(hmac.digest());

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return { valid: false, reason: 'INVALID_SIGNATURE' };
  }

  // 2. Parse payload
  let payload: SessionPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload));
  } catch {
    return { valid: false, reason: 'MALFORMED' };
  }

  // 3. Verify issuer and audience
  if (payload.iss !== ISSUER || payload.aud !== AUDIENCE) {
    return { valid: false, reason: 'INVALID_CLAIMS' };
  }

  // 4. Verify revocation
  if (revokedSessions.has(payload.sessionId) || revokedSessions.has(token)) {
    return { valid: false, reason: 'REVOKED' };
  }

  // 5. Verify expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    return { valid: false, reason: 'EXPIRED' };
  }

  return { valid: true, payload };
}

/**
 * Revokes an active session token or session ID
 */
export function revokeSession(tokenOrSessionId: string): void {
  if (!tokenOrSessionId) return;
  revokedSessions.add(tokenOrSessionId);
}

/**
 * Checks whether a session has been revoked
 */
export function isSessionRevoked(tokenOrSessionId: string): boolean {
  return revokedSessions.has(tokenOrSessionId);
}

/**
 * Standard cookie configuration for server-managed authentication
 */
export function getSessionCookieOptions(expiresInSeconds = DEFAULT_SESSION_DURATION_SECONDS) {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: expiresInSeconds,
  };
}
