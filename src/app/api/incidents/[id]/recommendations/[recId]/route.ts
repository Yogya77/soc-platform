import { NextRequest } from 'next/server';
import { AIService } from '@/server/services/ai.service';
import { jsonSuccess, jsonError, handleDatabaseError } from '@/server/api-response';
import { recommendationStatusSchema } from '@/server/validators';
import { requireDevOrAuth } from '@/server/auth-guard';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; recId: string }> }
) {
  const auth = requireDevOrAuth(req, 'write:incidents');
  if (!auth.authorized) return auth.response;

  try {
    const { id, recId } = await params;
    const body = await req.json();
    const parsed = recommendationStatusSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid recommendation status', 400, 'VALIDATION_ERROR', parsed.error.format());
    }

    const updated = await AIService.updateRecommendationStatus(id, recId, parsed.data.status, auth.auth.name);
    return jsonSuccess(updated);
  } catch (err: any) {
    if (err?.message?.includes('not found')) {
      return jsonError(err.message, 404, 'NOT_FOUND');
    }
    return handleDatabaseError(err);
  }
}
