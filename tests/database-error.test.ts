import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { handleDatabaseError } from '../src/server/api-response';

describe('Stage 3: Database Error Handling & Mapping', () => {
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

  test('maps unknown runtime exceptions to HTTP 500 without leaking stack traces', async () => {
    const runtimeErr = new Error('Unexpected null reference in parser');
    const response = handleDatabaseError(runtimeErr);
    assert.equal(response.status, 500);

    const json = await response.json();
    assert.equal(json.success, false);
    assert.equal(json.code, 'INTERNAL_SERVER_ERROR');
    assert.equal(json.error, 'An internal database error occurred while processing the request.');
  });
});
