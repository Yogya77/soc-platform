import { NextRequest } from 'next/server';
import { RulesService } from '@/server/services/rules.service';
import { jsonSuccess, jsonError, handleDatabaseError } from '@/server/api-response';
import { ruleStatusSchema } from '@/server/validators';
import { requireDevOrAuth } from '@/server/auth-guard';

async function handleStatusUpdate(
  req: NextRequest,
  paramsPromise: Promise<{ id: string }>
) {
  const auth = requireDevOrAuth(req, 'write:rules');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await paramsPromise;
    const body = await req.json();
    const parsed = ruleStatusSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid rule status request body', 400, 'VALIDATION_ERROR', parsed.error.format());
    }

    const updated = await RulesService.toggleStatus(id, parsed.data.enabled, auth.auth.name);
    return jsonSuccess(updated);
  } catch (err: any) {
    if (err?.message?.includes('not found')) {
      return jsonError(err.message, 404, 'NOT_FOUND');
    }
    return handleDatabaseError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleStatusUpdate(req, params);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleStatusUpdate(req, params);
}
