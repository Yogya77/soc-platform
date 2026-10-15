import { NextRequest } from 'next/server';
import { EventsService } from '@/server/services/events.service';
import { jsonSuccess, jsonError, handleDatabaseError } from '@/server/api-response';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await EventsService.getEventById(id);
    if (!event) {
      return jsonError(`Security event ${id} not found`, 404, 'NOT_FOUND');
    }
    return jsonSuccess(event);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
