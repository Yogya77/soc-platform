import { NextRequest } from 'next/server';
import { AssetsService } from '@/server/services/assets.service';
import { jsonSuccess, jsonError, handleDatabaseError } from '@/server/api-response';
import { requireAuth } from '@/server/auth-guard';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req, 'read:security_data');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const asset = await AssetsService.getAssetById(id);
    if (!asset) {
      return jsonError(`Asset '${id}' not found`, 404, 'NOT_FOUND');
    }
    return jsonSuccess(asset);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
