import { NextRequest } from 'next/server';
import { AssetsService } from '@/server/services/assets.service';
import { jsonSuccess, jsonError, handleDatabaseError } from '@/server/api-response';
import { assetIsolationSchema } from '@/server/validators';
import { requireDevOrAuth } from '@/server/auth-guard';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireDevOrAuth(req, 'write:assets');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = assetIsolationSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid isolation request body', 400, 'VALIDATION_ERROR', parsed.error.format());
    }

    const updated = await AssetsService.isolateAsset(id, parsed.data.isolate, auth.auth.name);
    return jsonSuccess(updated);
  } catch (err: any) {
    if (err?.message?.includes('not found')) {
      return jsonError(err.message, 404, 'NOT_FOUND');
    }
    return handleDatabaseError(err);
  }
}
