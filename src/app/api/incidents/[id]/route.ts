import { NextRequest } from 'next/server';
import { IncidentsService } from '@/server/services/incidents.service';
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
    const incident = await IncidentsService.getIncidentById(id);
    if (!incident) {
      return jsonError(`Incident ${id} not found`, 404, 'NOT_FOUND');
    }
    return jsonSuccess(incident);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
