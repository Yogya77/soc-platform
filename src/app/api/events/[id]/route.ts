import { NextRequest } from 'next/server';
import { EventsService } from '@/server/services/events.service';
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
    const event = await EventsService.getEventById(id);
    if (!event) {
      return jsonError(`Event ${id} not found`, 404, 'NOT_FOUND');
    }
    return jsonSuccess(event);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
