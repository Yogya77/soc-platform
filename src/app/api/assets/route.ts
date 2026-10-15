import { NextRequest } from 'next/server';
import { AssetsService } from '@/server/services/assets.service';
import { jsonSuccess, handleDatabaseError } from '@/server/api-response';
import { requireAuth } from '@/server/auth-guard';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, 'read:security_data');
  if (!auth.authorized) return auth.response;

  try {
    const assets = await AssetsService.getAssets();
    return jsonSuccess(assets);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
