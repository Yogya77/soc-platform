import { NextRequest } from 'next/server';
import { RulesService } from '@/server/services/rules.service';
import { jsonSuccess, jsonError, handleDatabaseError } from '@/server/api-response';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
