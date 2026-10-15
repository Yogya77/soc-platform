import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { jsonError } from '@/server/api-response';
import { loginSchema } from '@/server/validators';
import { getSessionCookieOptions } from '@/server/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid login credentials format', 400, 'VALIDATION_ERROR', parsed.error.format());
    }

    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    const result = await AuthService.login(parsed.data.email, parsed.data.password, ip);

    if (!result.success) {
      const status = result.code === 'RATE_LIMITED' ? 429 : 401;
      const res = jsonError(result.error, status, result.code);
      if (result.retryAfterSeconds) {
        res.headers.set('Retry-After', result.retryAfterSeconds.toString());
      }
      return res;
    }

    const responseBody = {
      success: true,
      message: 'Authentication successful',
      token: result.token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        department: result.user.department,
      },
    };

    const res = NextResponse.json(responseBody, { status: 200 });

    // Set server-managed HttpOnly session cookie
    const cookieOpts = getSessionCookieOptions();
    res.cookies.set({
      name: cookieOpts.name,
      value: result.token,
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    });

    return res;
  } catch (err: any) {
    return jsonError('An unexpected error occurred during authentication.', 500, 'INTERNAL_SERVER_ERROR');
  }
}
