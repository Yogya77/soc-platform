import { NextRequest } from 'next/server';
import { AlertsService } from '@/server/services/alerts.service';
import { jsonSuccess, handleDatabaseError } from '@/server/api-response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const severity = searchParams.get('severity') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const assetId = searchParams.get('assetId') || undefined;
    const ruleId = searchParams.get('ruleId') || undefined;

    const alerts = await AlertsService.getAlerts({
      severity,
      status,
      search,
      assetId,
      ruleId,
    });

    return jsonSuccess(alerts);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
