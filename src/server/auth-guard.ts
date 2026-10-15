import { NextRequest } from 'next/server';
import { jsonError } from './api-response';
import { verifySessionToken, SESSION_COOKIE_NAME, UserRole, SessionPayload } from './session';

export type Permission =
  | 'read:security_data'
  | 'write:alerts'
  | 'write:incidents'
  | 'write:assets'
  | 'write:rules'
  | 'write:settings'
  | 'write:audit_logs'
  | 'admin:all';

export interface AuthContext {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  isDevBypass: boolean;
}

// Strict Server-Side Role-Based Access Control (RBAC) Permission Matrix
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'read:security_data',
    'write:alerts',
    'write:incidents',
    'write:assets',
    'write:rules',
    'write:settings',
    'write:audit_logs',
    'admin:all',
  ],
  LEAD_ANALYST: [
    'read:security_data',
    'write:alerts',
    'write:incidents',
    'write:assets',
    'write:rules',
    'write:audit_logs',
  ],
  TIER2_ANALYST: [
    'read:security_data',
    'write:alerts',
    'write:incidents',
    'write:assets',
    'write:rules',
    'write:audit_logs',
  ],
  TIER1_ANALYST: [
    'read:security_data',
    'write:alerts',
    'write:incidents',
    'write:audit_logs',
  ],
  READ_ONLY: [
    'read:security_data',
  ],
};

/**
 * Checks whether a given role holds the requested permission
 */
export function hasPermission(role: UserRole, permission?: Permission): boolean {
  if (!permission) return true;
  const granted = ROLE_PERMISSIONS[role] || [];
  return granted.includes(permission) || granted.includes('admin:all');
}

/**
 * Extracts and cryptographically verifies the session token from cookies or Authorization header
 */
export function extractAndVerifySession(req: NextRequest):
  | { success: true; payload: SessionPayload; token: string }
  | { success: false; status: 401; code: string; message: string } {
  // 1. Check HttpOnly cookie
  let token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  // 2. If no cookie, check Authorization: Bearer <token>
  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) {
    return {
      success: false,
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Authentication required: A valid session cookie or Bearer token must be provided.',
    };
  }

  const verified = verifySessionToken(token);

  if (!verified.valid) {
    if (verified.reason === 'EXPIRED') {
      return {
        success: false,
        status: 401,
        code: 'SESSION_EXPIRED',
        message: 'Your session has expired. Please sign in again.',
      };
    }

    if (verified.reason === 'REVOKED') {
      return {
        success: false,
        status: 401,
        code: 'SESSION_REVOKED',
        message: 'Your session has been terminated or revoked. Please sign in again.',
      };
    }

    return {
      success: false,
      status: 401,
      code: 'INVALID_TOKEN',
      message: 'Invalid session signature or malformed token.',
    };
  }

  return { success: true, payload: verified.payload, token };
}

/**
 * Server-side authorization boundary enforcing cryptographic sessions and RBAC.
 * Denies access by default. Never trusts client-supplied user headers.
 */
export function requireAuth(
  req: NextRequest,
  permission?: Permission
): { authorized: true; auth: AuthContext; token: string } | { authorized: false; response: ReturnType<typeof jsonError> } {
  const sessionResult = extractAndVerifySession(req);

  if (!sessionResult.success) {
    return {
      authorized: false,
      response: jsonError(sessionResult.message, sessionResult.status, sessionResult.code),
    };
  }

  const { payload, token } = sessionResult;

  // Enforce server-side role permission checks
  if (permission && !hasPermission(payload.role, permission)) {
    return {
      authorized: false,
      response: jsonError(
        `Access denied: Account role '${payload.role}' lacks the required '${permission}' permission.`,
        403,
        'FORBIDDEN'
      ),
    };
  }

  return {
    authorized: true,
    auth: {
      userId: payload.userId,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      isDevBypass: false,
    },
    token,
  };
}

/**
 * Backward-compatible alias for requireAuth enforcing identical strict verification
 */
export function requireDevOrAuth(
  req: NextRequest,
  permission: Permission
): { authorized: true; auth: AuthContext } | { authorized: false; response: ReturnType<typeof jsonError> } {
  const result = requireAuth(req, permission);
  if (!result.authorized) {
    return { authorized: false, response: result.response };
  }
  return { authorized: true, auth: result.auth };
}
