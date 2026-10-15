import { NextRequest } from 'next/server';
import { SearchService } from '@/server/services/search.service';
import { jsonSuccess, handleDatabaseError } from '@/server/api-response';
import { requireAuth } from '@/server/auth-guard';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, 'read:security_data');
  if (!auth.authorized) return auth.response;

  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const results = await SearchService.searchOmni(query);
    return jsonSuccess(results);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
