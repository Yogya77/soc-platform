import { DashboardService } from '@/server/services/dashboard.service';
import { jsonSuccess, handleDatabaseError } from '@/server/api-response';

export async function GET() {
  try {
    const chart = await DashboardService.getActivityChart();
    return jsonSuccess(chart);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
