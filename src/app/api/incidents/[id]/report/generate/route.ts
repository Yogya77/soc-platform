import { NextRequest } from 'next/server';
import { ReportsService } from '@/server/services/reports.service';
import { jsonSuccess, jsonError, handleDatabaseError } from '@/server/api-response';
import { requireDevOrAuth } from '@/server/auth-guard';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireDevOrAuth(req, 'write:incidents');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const report = await ReportsService.generateReport(id, auth.auth.name);
    return jsonSuccess(report);
  } catch (err: any) {
    if (err?.message?.includes('not found')) {
      return jsonError(err.message, 404, 'NOT_FOUND');
    }
    return handleDatabaseError(err);
  }
}
