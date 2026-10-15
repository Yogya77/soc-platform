import { NextRequest } from 'next/server';
import { SettingsService } from '@/server/services/settings.service';
import { jsonSuccess, jsonError, handleDatabaseError } from '@/server/api-response';
import { requireAuth, requireDevOrAuth } from '@/server/auth-guard';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, 'read:security_data');
  if (!auth.authorized) return auth.response;

  try {
    const settings = await SettingsService.getSettings();
    return jsonSuccess(settings);
  } catch (err) {
    return handleDatabaseError(err);
  }
}

export async function POST(req: NextRequest) {
  const auth = requireDevOrAuth(req, 'write:settings');
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    if (!body.key || body.value === undefined) {
      return jsonError('Missing setting key or value', 400);
    }
    const updated = await SettingsService.updateSetting(body.key, body.value, body.description);
    return jsonSuccess(updated);
  } catch (err) {
    return handleDatabaseError(err);
  }
}
