import { NextRequest } from 'next/server';
import { SearchService } from '@/server/services/search.service';
import { jsonSuccess, handleDatabaseError } from '@/server/api-response';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const results = await SearchService.searchOmni(query);
    return jsonSuccess(results);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
