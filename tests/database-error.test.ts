import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { handleDatabaseError } from '../src/server/api-response';
import { checkDatabaseConnection } from '../src/lib/prisma';

describe('Stage 3 & 5: Database Error Handling & Connectivity Verification', () => {
  test('maps Prisma P1001 connection error to HTTP 503', async () => {
    const prismaError = {
      name: 'PrismaClientInitializationError',
      code: 'P1001',
      message: "Can't reach database server at `localhost:5432`. Please make sure your database server is running.",
    };

    const response = handleDatabaseError(prismaError);
    assert.equal(response.status, 503);

    const json = await response.json();
    assert.equal(json.success, false);
    assert.equal(json.code, 'DATABASE_UNAVAILABLE');
    assert.match(json.message, /localhost:5432/);
  });

  test('maps Prisma P1002 database timeout error to HTTP 503', async () => {
    const timeoutError = {
      name: 'PrismaClientInitializationError',
      code: 'P1002',
      message: 'The database server was reached, but timed out during handshake.',
    };

    const response = handleDatabaseError(timeoutError);
    assert.equal(response.status, 503);

    const json = await response.json();
    assert.equal(json.code, 'DATABASE_UNAVAILABLE');
  });

  test('maps raw ECONNREFUSED network error to HTTP 503', async () => {
    const connError = new Error('connect ECONNREFUSED 127.0.0.1:5432');
    const response = handleDatabaseError(connError);
    assert.equal(response.status, 503);

    const json = await response.json();
    assert.equal(json.code, 'DATABASE_UNAVAILABLE');
  });

  test('maps Prisma P2025 record not found to HTTP 404', async () => {
    const notFoundError = {
      name: 'PrismaClientKnownRequestError',
      code: 'P2025',
      message: 'An operation failed because it depends on one or more records that were required but not found.',
    };

    const response = handleDatabaseError(notFoundError);
    assert.equal(response.status, 404);

    const json = await response.json();
    assert.equal(json.success, false);
    assert.equal(json.code, 'NOT_FOUND');
    assert.equal(json.error, 'Record Not Found');
  });

  test('maps Prisma P2002 unique constraint violation to HTTP 409', async () => {
    const conflictError = {
      name: 'PrismaClientKnownRequestError',
      code: 'P2002',
      meta: { target: ['email'] },
      message: 'Unique constraint failed on the fields: (`email`)',
    };

    const response = handleDatabaseError(conflictError);
    assert.equal(response.status, 409);

    const json = await response.json();
    assert.equal(json.success, false);
    assert.equal(json.code, 'CONFLICT');
    assert.deepEqual(json.fields, ['email']);
  });

  test('maps unknown runtime exceptions to HTTP 500 without leaking stack traces', async () => {
    const runtimeErr = new Error('Unexpected null reference in parser');
    const response = handleDatabaseError(runtimeErr);
    assert.equal(response.status, 500);

    const json = await response.json();
    assert.equal(json.success, false);
    assert.equal(json.code, 'INTERNAL_SERVER_ERROR');
    assert.equal(json.error, 'An internal database error occurred while processing the request.');
  });

  test('checkDatabaseConnection handles connection check without throwing unhandled exceptions', async () => {
    const result = await checkDatabaseConnection();
    assert.equal(typeof result.connected, 'boolean');
    if (!result.connected) {
      assert.equal(typeof result.error, 'string');
      assert.ok(result.error!.length > 0);
    } else {
      assert.equal(typeof result.latencyMs, 'number');
    }
  });
});
