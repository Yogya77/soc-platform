import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { extractAndVerifySession } from '@/server/auth-guard';
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from '@/server/session';

export async function POST(req: NextRequest) {
  const sessionResult = extractAndVerifySession(req);

  if (sessionResult.success) {
    await AuthService.logout(sessionResult.token, {
      id: sessionResult.payload.userId,
      name: sessionResult.payload.name,
    });
  }

  const res = NextResponse.json({
    success: true,
    message: 'Session terminated successfully.',
  });

  // Clear session cookie
  const cookieOpts = getSessionCookieOptions(0);
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: cookieOpts.httpOnly,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    path: cookieOpts.path,
    maxAge: 0,
  });

  return res;
}
