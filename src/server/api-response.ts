import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400, code = 'BAD_REQUEST', details?: any) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      details,
    },
    { status }
  );
}

/**
 * Handles database errors and maps connection failures to HTTP 503
 */
export function handleDatabaseError(err: any) {
  console.error('[Database Error]:', err?.message || err);

  // Prisma connection failure codes
  // P1000: Authentication failed
  // P1001: Can't reach database server
  // P1002: Database server was reached but timed out
  // P1003: Database does not exist
  const errorCode = err?.code;
  const isConnectionFailure =
    errorCode === 'P1001' ||
    errorCode === 'P1002' ||
    errorCode === 'P1003' ||
    err?.message?.includes("Can't reach database server") ||
    err?.message?.includes('connect ECONNREFUSED');

  if (isConnectionFailure) {
    return NextResponse.json(
      {
        success: false,
        error: 'Database Service Unavailable',
        message: 'The PostgreSQL database at localhost:5432 is currently unreachable. Please ensure PostgreSQL is started.',
        code: 'DATABASE_UNAVAILABLE',
      },
      { status: 503 }
    );
  }

  // Record not found
  if (errorCode === 'P2025') {
    return NextResponse.json(
      {
        success: false,
        error: 'Record Not Found',
        code: 'NOT_FOUND',
      },
      { status: 404 }
    );
  }

  // Unique constraint violation
  if (errorCode === 'P2002') {
    return NextResponse.json(
      {
        success: false,
        error: 'A record with this identifier or unique field already exists.',
        code: 'CONFLICT',
        fields: err.meta?.target,
      },
      { status: 409 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: 'An internal database error occurred while processing the request.',
      code: 'INTERNAL_SERVER_ERROR',
    },
    { status: 500 }
  );
}
