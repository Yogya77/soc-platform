import { NextRequest } from 'next/server';
import { IncidentsService } from '@/server/services/incidents.service';
import { jsonSuccess, jsonError, handleDatabaseError } from '@/server/api-response';
import { incidentAssignSchema } from '@/server/validators';
import { requireDevOrAuth } from '@/server/auth-guard';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireDevOrAuth(req, 'write:incidents');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = incidentAssignSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid analyst assignment value', 400, 'VALIDATION_ERROR', parsed.error.format());
    }

    const updated = await IncidentsService.assignAnalyst(id, parsed.data.analyst, auth.auth.name);
    return jsonSuccess(updated);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
