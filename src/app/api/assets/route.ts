import { NextRequest } from 'next/server';
import { AssetsService } from '@/server/services/assets.service';
import { jsonSuccess, handleDatabaseError } from '@/server/api-response';

export async function GET(req: NextRequest) {
  try {
    const assets = await AssetsService.getAssets();
    return jsonSuccess(assets);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
