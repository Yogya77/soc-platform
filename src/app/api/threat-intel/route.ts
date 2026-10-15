import { NextRequest } from 'next/server';
import { ThreatIntelService } from '@/server/services/threat-intel.service';
import { jsonSuccess, handleDatabaseError } from '@/server/api-response';

export async function GET(req: NextRequest) {
  try {
    const indicators = await ThreatIntelService.getThreatIntel();
    return jsonSuccess(indicators);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
