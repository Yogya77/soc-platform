import { NextRequest } from 'next/server';
import { AlertsService } from '@/server/services/alerts.service';
import { jsonSuccess, jsonError, handleDatabaseError } from '@/server/api-response';
import { alertStatusSchema } from '@/server/validators';
import { requireDevOrAuth } from '@/server/auth-guard';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireDevOrAuth(req, 'write:alerts');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = alertStatusSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid status update request', 400, 'VALIDATION_ERROR', parsed.error.format());
    }

    const updated = await AlertsService.updateStatus(id, parsed.data.status, parsed.data.note, auth.auth.name);
    return jsonSuccess(updated);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
