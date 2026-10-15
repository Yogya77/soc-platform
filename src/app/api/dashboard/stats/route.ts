import { DashboardService } from '@/server/services/dashboard.service';
import { jsonSuccess, handleDatabaseError } from '@/server/api-response';

export async function GET() {
  try {
    const stats = await DashboardService.getStats();
    return jsonSuccess(stats);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
