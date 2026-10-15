import { NextRequest } from 'next/server';
import { ThreatIntelService } from '@/server/services/threat-intel.service';
import { jsonSuccess, handleDatabaseError } from '@/server/api-response';
import { requireAuth } from '@/server/auth-guard';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, 'read:security_data');
  if (!auth.authorized) return auth.response;

  try {
    const indicators = await ThreatIntelService.getThreatIntel();
    return jsonSuccess(indicators);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
