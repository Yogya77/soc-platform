import { NextRequest } from 'next/server';
import { extractAndVerifySession } from '@/server/auth-guard';
import { jsonSuccess, jsonError } from '@/server/api-response';

export async function GET(req: NextRequest) {
  const sessionResult = extractAndVerifySession(req);

  if (!sessionResult.success) {
    return jsonError(sessionResult.message, sessionResult.status, sessionResult.code);
  }

  const { payload } = sessionResult;

  return jsonSuccess({
    authenticated: true,
    user: {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      department: payload.department,
    },
  });
}
