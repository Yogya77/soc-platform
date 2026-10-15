import { NextRequest } from 'next/server';
import { AuditService } from '@/server/services/audit.service';
import { jsonSuccess, jsonError, handleDatabaseError } from '@/server/api-response';
import { auditLogCreateSchema } from '@/server/validators';
import { requireDevOrAuth } from '@/server/auth-guard';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = Number(searchParams.get('limit')) || 100;
    const logs = await AuditService.getLogs(limit);
    return jsonSuccess(logs);
  } catch (err) {
    return handleDatabaseError(err);
  }
}

export async function POST(req: NextRequest) {
  const auth = requireDevOrAuth(req, 'write:audit_logs');
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const parsed = auditLogCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid audit log payload', 400, 'VALIDATION_ERROR', parsed.error.format());
    }

    const created = await AuditService.addLog(parsed.data);
    return jsonSuccess(created, 201);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
