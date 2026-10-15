import { NextRequest } from 'next/server';
import { DashboardService } from '@/server/services/dashboard.service';
import { jsonSuccess, handleDatabaseError } from '@/server/api-response';
import { requireAuth } from '@/server/auth-guard';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, 'read:security_data');
  if (!auth.authorized) return auth.response;

  try {
    const stats = await DashboardService.getStats();
    return jsonSuccess(stats);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
