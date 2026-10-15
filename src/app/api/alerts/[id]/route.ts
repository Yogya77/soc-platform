import { NextRequest } from 'next/server';
import { AlertsService } from '@/server/services/alerts.service';
import { jsonSuccess, jsonError, handleDatabaseError } from '@/server/api-response';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const alert = await AlertsService.getAlertById(id);
    if (!alert) {
      return jsonError(`Alert ${id} not found`, 404, 'NOT_FOUND');
    }
    return jsonSuccess(alert);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
