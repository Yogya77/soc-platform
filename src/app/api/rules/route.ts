import { NextRequest } from 'next/server';
import { RulesService } from '@/server/services/rules.service';
import { jsonSuccess, handleDatabaseError } from '@/server/api-response';
import { requireAuth } from '@/server/auth-guard';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, 'read:security_data');
  if (!auth.authorized) return auth.response;

  try {
    const rules = await RulesService.getRules();
    return jsonSuccess(rules);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
