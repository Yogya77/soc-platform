import { NextRequest } from 'next/server';
import { RulesService } from '@/server/services/rules.service';
import { jsonSuccess, jsonError, handleDatabaseError } from '@/server/api-response';
import { requireDevOrAuth } from '@/server/auth-guard';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireDevOrAuth(req, 'write:rules');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const testResult = await RulesService.testRule(id, auth.auth.name);
    return jsonSuccess(testResult);
  } catch (err: any) {
    if (err?.message?.includes('not found')) {
      return jsonError(err.message, 404, 'NOT_FOUND');
    }
    return handleDatabaseError(err);
  }
}
