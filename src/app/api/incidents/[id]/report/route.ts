import { NextRequest } from 'next/server';
import { ReportsService } from '@/server/services/reports.service';
import { jsonSuccess, handleDatabaseError } from '@/server/api-response';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await ReportsService.getReport(id);
    return jsonSuccess(report);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
