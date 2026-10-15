interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil?: number;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Checks whether an IP or identifier has exceeded allowed login attempts
 */
export function checkLoginRateLimit(identifier: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if currently blocked
  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  // Check if window has expired
  if (now - record.firstAttemptAt > WINDOW_MS) {
    rateLimitStore.delete(identifier);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - record.attempts);
  return {
    allowed: record.attempts < MAX_ATTEMPTS,
    remainingAttempts,
  };
}

/**
 * Records a failed login attempt
 */
export function recordFailedLoginAttempt(identifier: string): {
  isBlocked: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(identifier) || {
    attempts: 0,
    firstAttemptAt: now,
  };

  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    rateLimitStore.set(identifier, record);
    return {
      isBlocked: true,
      retryAfterSeconds: Math.ceil(BLOCK_DURATION_MS / 1000),
    };
  }

  rateLimitStore.set(identifier, record);
  return { isBlocked: false };
}

/**
 * Resets failed attempts after a successful login
 */
export function resetLoginAttempts(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Clear all rate limits (for automated testing purposes)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}
