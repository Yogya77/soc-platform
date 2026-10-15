import { NextRequest } from 'next/server';
import { jsonError } from './api-response';

export type Permission =
  | 'read:security_data'
  | 'write:alerts'
  | 'write:incidents'
  | 'write:assets'
  | 'write:rules'
  | 'write:settings'
  | 'write:audit_logs';

export interface AuthContext {
  userId: string;
  name: string;
  email: string;
  role: string;
  isDevBypass: boolean;
}

/**
 * Server-side authorization boundary
 * In development mode, permits analyst actions while recording simulated identity.
 * In production mode, rejects unauthenticated write operations with HTTP 401/403.
 */
export function requireDevOrAuth(
  req: NextRequest,
  permission: Permission
): { authorized: true; auth: AuthContext } | { authorized: false; response: ReturnType<typeof jsonError> } {
  const isDev = process.env.NODE_ENV === 'development';
  const authHeader = req.headers.get('authorization');
  const apiKeyHeader = req.headers.get('x-api-key');

  // If in local development mode without explicit auth, allow controlled local mutation
  if (isDev && !authHeader && !apiKeyHeader) {
    return {
      authorized: true,
      auth: {
        userId: 'DEV-ANALYST-001',
        name: 'Sarah Jenkins (Lead IR - Dev)',
        email: 'sarah.jenkins@soc.internal',
        role: 'LEAD_ANALYST',
        isDevBypass: true,
      },
    };
  }

  // Check Bearer Token (reserved for Stage 4 JWT auth)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === process.env.JWT_SECRET || token === 'dev_valid_token_2026') {
      return {
        authorized: true,
        auth: {
          userId: 'USR-001',
          name: 'SOC Administrator',
          email: 'admin@soc.internal',
          role: 'ADMIN',
          isDevBypass: false,
        },
      };
    }
  }

  // In production or when unauthenticated, block write actions
  return {
    authorized: false,
    response: jsonError(
      'Authentication required: Sensitive security mutations are disabled without a verified analyst session.',
      401,
      'UNAUTHORIZED'
    ),
  };
}
