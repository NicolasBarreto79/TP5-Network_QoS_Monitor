import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'node:http';
import { createServer } from './server.js';

describe('Reference Backend Test Suite', () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    const app = createServer();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr !== null) {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  test('GET /health returns status ok and service metadata', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const data = (await res.json()) as any;
    assert.equal(data.status, 'ok');
    assert.equal(data.service, 'network-qos-reference-backend');
    assert.ok(data.timestamp > 0);
  });

  test('GET /api/ping returns fast pong response', async () => {
    const start = performance.now();
    const res = await fetch(`${baseUrl}/api/ping`);
    const elapsed = performance.now() - start;
    assert.equal(res.status, 200);
    const data = (await res.json()) as any;
    assert.equal(data.pong, true);
    assert.ok(elapsed < 100, `Ping roundtrip should be fast locally, took ${elapsed}ms`);
  });

  test('GET /api/download streams exact binary payload', async () => {
    // Request 1 MB payload
    const res = await fetch(`${baseUrl}/api/download?sizeMb=1`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'application/octet-stream');
    const contentLength = res.headers.get('content-length');
    assert.equal(contentLength, (1 * 1024 * 1024).toString());

    const buffer = await res.arrayBuffer();
    assert.equal(buffer.byteLength, 1024 * 1024);
  });

  test('POST /api/upload measures uploaded bytes and returns speed', async () => {
    const testPayload = Buffer.alloc(512 * 1024, 0x55); // 512 KB
    const res = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      body: testPayload,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });

    assert.equal(res.status, 200);
    const data = (await res.json()) as any;
    assert.equal(data.success, true);
    assert.equal(data.bytesReceived, 512 * 1024);
    assert.ok(data.durationMs >= 0);
    assert.ok(data.speedMbps > 0);
  });

  test('GET /api/info returns available host addresses', async () => {
    const res = await fetch(`${baseUrl}/api/info`);
    assert.equal(res.status, 200);
    const data = (await res.json()) as any;
    assert.ok(Array.isArray(data.availableAddresses));
  });
});
