import { NextRequest } from 'next/server';
import { EventsService } from '@/server/services/events.service';
import { jsonSuccess, handleDatabaseError } from '@/server/api-response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventIdParam = searchParams.get('eventId');
    const eventId = eventIdParam ? parseInt(eventIdParam, 10) : undefined;
    const hostname = searchParams.get('hostname') || undefined;
    const username = searchParams.get('username') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const search = searchParams.get('search') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    const events = await EventsService.getEvents({
      eventId,
      hostname,
      username,
      severity,
      search,
      limit,
    });

    return jsonSuccess(events);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
