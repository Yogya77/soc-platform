import { NextRequest } from 'next/server';
import { AlertsService } from '@/server/services/alerts.service';
import { jsonSuccess, jsonError, handleDatabaseError } from '@/server/api-response';
import { alertLinkSchema } from '@/server/validators';
import { requireDevOrAuth } from '@/server/auth-guard';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireDevOrAuth(req, 'write:alerts');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = alertLinkSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid link request', 400, 'VALIDATION_ERROR', parsed.error.format());
    }

    const incident = await AlertsService.linkToIncident(id, parsed.data.incidentId, auth.auth.name);
    return jsonSuccess(incident);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
