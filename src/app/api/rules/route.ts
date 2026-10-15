import { NextRequest } from 'next/server';
import { RulesService } from '@/server/services/rules.service';
import { jsonSuccess, handleDatabaseError } from '@/server/api-response';

export async function GET(req: NextRequest) {
  try {
    const rules = await RulesService.getRules();
    return jsonSuccess(rules);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
