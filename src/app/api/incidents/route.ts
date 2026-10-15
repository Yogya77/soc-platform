import { NextRequest } from 'next/server';
import { IncidentsService } from '@/server/services/incidents.service';
import { jsonSuccess, jsonError, handleDatabaseError } from '@/server/api-response';
import { incidentCreateSchema } from '@/server/validators';
import { requireAuth, requireDevOrAuth } from '@/server/auth-guard';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, 'read:security_data');
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const severity = searchParams.get('severity') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const assignedAnalyst = searchParams.get('assignedAnalyst') || undefined;

    const incidents = await IncidentsService.getIncidents({
      severity,
      status,
      search,
      assignedAnalyst,
    });

    return jsonSuccess(incidents);
  } catch (err) {
    return handleDatabaseError(err);
  }
}

export async function POST(req: NextRequest) {
  const auth = requireDevOrAuth(req, 'write:incidents');
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const parsed = incidentCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid incident creation request', 400, 'VALIDATION_ERROR', parsed.error.format());
    }

    const created = await IncidentsService.createIncident({
      ...parsed.data,
      assignedAnalyst: auth.auth.name,
    });
    return jsonSuccess(created, 201);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
