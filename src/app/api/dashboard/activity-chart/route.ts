import { NextRequest } from 'next/server';
import { DashboardService } from '@/server/services/dashboard.service';
import { jsonSuccess, handleDatabaseError } from '@/server/api-response';
import { requireAuth } from '@/server/auth-guard';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, 'read:security_data');
  if (!auth.authorized) return auth.response;

  try {
    const chart = await DashboardService.getActivityChart();
    return jsonSuccess(chart);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
