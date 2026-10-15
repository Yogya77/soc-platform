import { NextRequest } from 'next/server';
import { ThreatIntelService } from '@/server/services/threat-intel.service';
import { jsonSuccess, jsonError, handleDatabaseError } from '@/server/api-response';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const value = searchParams.get('value');

    if (!value) {
      return jsonError('Query parameter "value" is required', 400, 'MISSING_PARAM');
    }

    const indicator = await ThreatIntelService.getThreatIndicatorByValue(value);
    // Return null (200 OK) if not found so client receives null instead of network error
    return jsonSuccess(indicator);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
