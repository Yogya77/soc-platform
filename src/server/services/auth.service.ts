import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signSessionToken, revokeSession, SessionPayload, UserRole } from '../session';
import { checkLoginRateLimit, recordFailedLoginAttempt, resetLoginAttempts } from '../auth-rate-limit';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  isActive: boolean;
}

// Precomputed offline fallback accounts matching prisma/seed.ts
const OFFLINE_USERS: AuthenticatedUser[] = [
  {
    id: 'USR-001',
    email: 'admin@soc.internal',
    name: 'SOC Administrator',
    role: 'ADMIN',
    department: 'SOC Engineering',
    isActive: true,
  },
  {
    id: 'USR-002',
    email: 'sarah.jenkins@soc.internal',
    name: 'Sarah Jenkins',
    role: 'LEAD_ANALYST',
    department: 'Incident Response',
    isActive: true,
  },
  {
    id: 'USR-003',
    email: 'marcus.vance@soc.internal',
    name: 'Marcus Vance',
    role: 'TIER2_ANALYST',
    department: 'Threat Operations',
    isActive: true,
  },
  {
    id: 'USR-004',
    email: 'auditor@soc.internal',
    name: 'Compliance Auditor',
    role: 'READ_ONLY',
    department: 'Internal Audit',
    isActive: true,
  },
];

const OFFLINE_PASSWORD_HASHES: Record<string, string> = {
  'admin@soc.internal': '$2b$10$PeVAHdXBNe/kXZIligWFN.EZSQi93pS5scKoHbz2Mpr8ywxhGOuTq', // Admin@2026!
  'sarah.jenkins@soc.internal': '$2b$10$uYDu59o6tbrr0zWutfWgA.mOVrY9aPweRganDeFCpc/fWanZYqE.6', // Analyst@2026!
  'marcus.vance@soc.internal': '$2b$10$uYDu59o6tbrr0zWutfWgA.mOVrY9aPweRganDeFCpc/fWanZYqE.6', // Analyst@2026!
  'auditor@soc.internal': '$2b$10$1XJLZDPJY93tKyEeSt7iUun6x71nn1niRC0gt3Y9aEMMMRoK.H0P.', // Auditor@2026!
};

// Dummy hash for constant-time comparison when email is not found
const DUMMY_HASH = '$2b$10$111111111111111111111.1111111111111111111111111111111';

let dbOfflineUntil = 0;

function isDbOffline(): boolean {
  return Date.now() < dbOfflineUntil;
}

function markDbOffline(): void {
  dbOfflineUntil = Date.now() + 30_000;
}

export class AuthService {
  /**
   * Safe password verification with constant-time check and account enumeration prevention
   */
  static async verifyCredentials(
    email: string,
    passwordPlain: string
  ): Promise<{ success: true; user: AuthenticatedUser } | { success: false; reason: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    let user: AuthenticatedUser | null = null;
    let passwordHash: string | null = null;

    // 1. Try querying PostgreSQL database if not known to be offline
    if (!isDbOffline()) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (dbUser) {
          user = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role as UserRole,
            department: dbUser.department ?? undefined,
            isActive: dbUser.isActive,
          };
          passwordHash = dbUser.passwordHash;
        }
      } catch {
        markDbOffline();
      }
    }

    const allowOfflineFallback = process.env.NODE_ENV !== 'production';

    // 2. If in dev/test and database is offline or user not in DB, allow baseline accounts
    if (!user && allowOfflineFallback && OFFLINE_PASSWORD_HASHES[normalizedEmail]) {
      const offline = OFFLINE_USERS.find((u) => u.email === normalizedEmail);
      if (offline) {
        user = offline;
        passwordHash = OFFLINE_PASSWORD_HASHES[normalizedEmail];
      }
    }

    // 3. Constant-time comparison: if user not found, compare against dummy hash
    if (!user || !passwordHash) {
      await bcrypt.compare(passwordPlain, DUMMY_HASH);
      return { success: false, reason: 'INVALID_CREDENTIALS' };
    }

    if (!user.isActive) {
      return { success: false, reason: 'ACCOUNT_DISABLED' };
    }

    const isMatch = await bcrypt.compare(passwordPlain, passwordHash);
    if (!isMatch) {
      return { success: false, reason: 'INVALID_CREDENTIALS' };
    }

    return { success: true, user };
  }

  /**
   * Execute authenticated login sequence with rate limiting and audit logging
   */
  static async login(
    email: string,
    passwordPlain: string,
    ipAddress = '127.0.0.1'
  ): Promise<{
    success: true;
    token: string;
    payload: SessionPayload;
    user: AuthenticatedUser;
  } | {
    success: false;
    error: string;
    code: 'RATE_LIMITED' | 'INVALID_CREDENTIALS' | 'ACCOUNT_DISABLED';
    retryAfterSeconds?: number;
  }> {
    const normalizedEmail = email.trim().toLowerCase();
    const ipKey = `ip:${ipAddress}`;
    const accountKey = `account:${normalizedEmail}`;

    // 1. Check rate limit on both client IP and targeted account
    const ipLimit = checkLoginRateLimit(ipKey);
    const accountLimit = checkLoginRateLimit(accountKey);

    if (!ipLimit.allowed || !accountLimit.allowed) {
      const retryAfterSeconds = Math.max(
        ipLimit.retryAfterSeconds || 0,
        accountLimit.retryAfterSeconds || 0
      ) || 900;

      return {
        success: false,
        error: 'Too many failed login attempts. Please try again later.',
        code: 'RATE_LIMITED',
        retryAfterSeconds,
      };
    }

    // 2. Verify credentials
    const result = await this.verifyCredentials(email, passwordPlain);

    if (!result.success) {
      const failedIp = recordFailedLoginAttempt(ipKey);
      const failedAccount = recordFailedLoginAttempt(accountKey);

      // Audit failed attempt if DB available
      if (!isDbOffline()) {
        try {
          await prisma.auditLog.create({
            data: {
              id: `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`,
              analyst: 'Security Gate',
              action: 'LOGIN_FAILURE',
              targetType: 'AUTH',
              targetId: normalizedEmail,
              details: `Failed authentication attempt from IP ${ipAddress}. Reason: ${result.reason}`,
            },
          });
        } catch {
          markDbOffline();
        }
      }

      if (failedIp.isBlocked || failedAccount.isBlocked) {
        return {
          success: false,
          error: 'Too many failed login attempts. Account temporarily locked.',
          code: 'RATE_LIMITED',
          retryAfterSeconds: Math.max(failedIp.retryAfterSeconds || 0, failedAccount.retryAfterSeconds || 0) || 900,
        };
      }

      return {
        success: false,
        error: 'Invalid email or password.',
        code: result.reason === 'ACCOUNT_DISABLED' ? 'ACCOUNT_DISABLED' : 'INVALID_CREDENTIALS',
      };
    }

    // 3. Login succeeded: reset rate limit attempts for both IP and account
    resetLoginAttempts(ipKey);
    resetLoginAttempts(accountKey);

    const user = result.user;
    const { token, payload } = signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
    });

    // 4. Record session in database if available
    if (!isDbOffline()) {
      try {
        await prisma.session.create({
          data: {
            token,
            userId: user.id,
            expiresAt: new Date(payload.exp * 1000),
          },
        });

        await prisma.auditLog.create({
          data: {
            id: `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`,
            analyst: user.name,
            action: 'LOGIN_SUCCESS',
            targetType: 'AUTH',
            targetId: user.id,
            details: `User ${user.email} (${user.role}) authenticated successfully from ${ipAddress}.`,
          },
        });
      } catch {
        markDbOffline();
      }
    }

    return {
      success: true,
      token,
      payload,
      user,
    };
  }

  /**
   * Terminates active session and records audit event
   */
  static async logout(
    token: string,
    user?: { name: string; id: string }
  ): Promise<void> {
    revokeSession(token);

    try {
      await prisma.session.deleteMany({
        where: { token },
      });

      if (user) {
        await prisma.auditLog.create({
          data: {
            id: `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`,
            analyst: user.name,
            action: 'LOGOUT',
            targetType: 'AUTH',
            targetId: user.id,
            details: `Analyst session terminated for ${user.name}.`,
          },
        });
      }
    } catch {
      // Non-blocking if DB offline
    }
  }

  /**
   * Retrieve user profile by ID
   */
  static async getUserById(userId: string): Promise<AuthenticatedUser | null> {
    try {
      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      if (dbUser) {
        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role as UserRole,
          department: dbUser.department ?? undefined,
          isActive: dbUser.isActive,
        };
      }
    } catch {
      // Fallback
    }

    return OFFLINE_USERS.find((u) => u.id === userId) || null;
  }
}
