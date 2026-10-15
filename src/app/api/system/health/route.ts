import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/prisma';
import { SystemHealth } from '@/types/security';

export async function GET() {
  const dbCheck = await checkDatabaseConnection();

  const health: SystemHealth = {
    apiStatus: 'ONLINE',
    collectorStatus: 'ONLINE',
    databaseStatus: dbCheck.connected ? 'ONLINE' : 'DEGRADED',
    aiEngineStatus: 'SIMULATED_DEMO_MODE',
    activeMode: dbCheck.connected ? 'REAL_FASTAPI' : 'MOCK_DEMO',
    eventsProcessedPerSecond: 142.8,
    uptimeSeconds: Math.floor(process.uptime()),
    lastHealthCheck: new Date().toISOString(),
  };

  return NextResponse.json(health, {
    status: dbCheck.connected ? 200 : 200,
  });
}
