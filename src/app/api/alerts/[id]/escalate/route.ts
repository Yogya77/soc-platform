import { NextRequest } from 'next/server';
import { AlertsService } from '@/server/services/alerts.service';
import { jsonSuccess, jsonError, handleDatabaseError } from '@/server/api-response';
import { alertEscalateSchema } from '@/server/validators';
import { requireDevOrAuth } from '@/server/auth-guard';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireDevOrAuth(req, 'write:incidents');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    let body = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional
    }

    const parsed = alertEscalateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid escalation request', 400, 'VALIDATION_ERROR', parsed.error.format());
    }

    const incident = await AlertsService.escalateToIncident(id, parsed.data, auth.auth.name);
    return jsonSuccess(incident, 201);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
