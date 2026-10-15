import { NextRequest } from 'next/server';
import { AIService } from '@/server/services/ai.service';
import { jsonSuccess, jsonError, handleDatabaseError } from '@/server/api-response';
import { requireDevOrAuth } from '@/server/auth-guard';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const investigation = await AIService.getInvestigation(id);
    return jsonSuccess(investigation);
  } catch (err) {
    return handleDatabaseError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireDevOrAuth(req, 'write:incidents');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const result = await AIService.startInvestigation(id, auth.auth.name);
    return jsonSuccess(result);
  } catch (err: any) {
    if (err?.message?.includes('not found')) {
      return jsonError(err.message, 404, 'NOT_FOUND');
    }
    return handleDatabaseError(err);
  }
}
