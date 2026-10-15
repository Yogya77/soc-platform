import { NextRequest } from 'next/server';
import { RulesService } from '@/server/services/rules.service';
import { jsonSuccess, jsonError, handleDatabaseError } from '@/server/api-response';
import { requireAuth } from '@/server/auth-guard';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req, 'read:security_data');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const rule = await RulesService.getRuleById(id);
    if (!rule) {
      return jsonError(`Detection rule '${id}' not found`, 404, 'NOT_FOUND');
    }
    return jsonSuccess(rule);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
