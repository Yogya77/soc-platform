import { NextRequest } from 'next/server';
import { IncidentsService } from '@/server/services/incidents.service';
import { jsonSuccess, jsonError, handleDatabaseError } from '@/server/api-response';
import { incidentNoteSchema } from '@/server/validators';
import { requireDevOrAuth } from '@/server/auth-guard';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireDevOrAuth(req, 'write:incidents');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = incidentNoteSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid note content', 400, 'VALIDATION_ERROR', parsed.error.format());
    }

    const updated = await IncidentsService.addNote(
      id,
      parsed.data.author || auth.auth.name,
      parsed.data.content
    );
    return jsonSuccess(updated, 201);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
