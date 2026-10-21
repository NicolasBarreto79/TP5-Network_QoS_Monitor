import express, { Request, Response } from 'express';
import cors from 'cors';
import os from 'os';

export function createServer() {
  const app = express();

  app.use(cors());
  app.use((_req, res, next) => {
    res.setHeader('X-Powered-By', 'Network-QoS-Monitor-Reference-Backend');
    next();
  });

  // Healthcheck endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'network-qos-reference-backend',
      timestamp: Date.now(),
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsage: process.memoryUsage(),
      hostname: os.hostname(),
    });
  });

  // Ultra-fast HTTP ping probe endpoint (<1ms server response)
  app.get('/api/ping', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.status(200).json({
      pong: true,
      serverTime: Date.now(),
    });
  });

  // Fixed-size binary download payload endpoint for Throughput test
  app.get('/api/download', (req: Request, res: Response) => {
    const sizeMbParam = req.query.sizeMb ? parseFloat(req.query.sizeMb as string) : 5;
    const sizeMb = isNaN(sizeMbParam) || sizeMbParam <= 0 ? 5 : Math.min(sizeMbParam, 100);
    const totalBytes = Math.floor(sizeMb * 1024 * 1024);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', totalBytes.toString());
    res.setHeader('Content-Disposition', `attachment; filename="qos-payload-${sizeMb}mb.bin"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    const chunkSize = 64 * 1024; // 64 KB chunks
    const chunk = Buffer.alloc(chunkSize, 0xaa); // 10101010 pattern
    let bytesSent = 0;

    function sendNext() {
      while (bytesSent < totalBytes) {
        const remaining = totalBytes - bytesSent;
        const currentChunkSize = Math.min(chunkSize, remaining);
        const bufferToSend = currentChunkSize === chunkSize ? chunk : chunk.subarray(0, currentChunkSize);

        bytesSent += currentChunkSize;
        const canContinue = res.write(bufferToSend);

        if (!canContinue) {
          res.once('drain', sendNext);
          return;
        }
      }
      res.end();
    }

    sendNext();
  });

  // Upload test endpoint (measures received byte stream and duration)
  app.post('/api/upload', (req: Request, res: Response) => {
    const startTimeNs = process.hrtime.bigint();
    let bytesReceived = 0;

    req.on('data', (chunk: Buffer) => {
      bytesReceived += chunk.length;
    });

    req.on('end', () => {
      const endTimeNs = process.hrtime.bigint();
      const durationMs = Number(endTimeNs - startTimeNs) / 1_000_000;
      const durationSeconds = durationMs / 1000;

      // Speed in Megabits per second: (bytes * 8) / (seconds * 1,000,000)
      const speedMbps = durationSeconds > 0 
        ? Number(((bytesReceived * 8) / (durationSeconds * 1_000_000)).toFixed(2))
        : 0;

      res.status(200).json({
        success: true,
        bytesReceived,
        durationMs: Number(durationMs.toFixed(2)),
        speedMbps,
        timestamp: Date.now(),
      });
    });

    req.on('error', (err) => {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    });
  });

  // Host and network interfaces info endpoint
  app.get('/api/info', (_req: Request, res: Response) => {
    const interfaces = os.networkInterfaces();
    const addresses: string[] = [];

    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (!net.internal && net.family === 'IPv4') {
          addresses.push(`${name}: ${net.address}`);
        }
      }
    }

    res.json({
      service: 'QoS Reference Backend',
      version: '1.0.0',
      availableAddresses: addresses,
      timestamp: Date.now(),
    });
  });

  return app;
}

// Start server only when executed directly as main script
const isTestEnv = 
  process.env.NODE_ENV === 'test' || 
  Boolean(process.env.NODE_TEST_CONTEXT) || 
  process.argv.some((arg) => arg.includes('test'));

if (!isTestEnv) {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const app = createServer();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[QoS Backend] Reference test server listening on http://0.0.0.0:${PORT}`);
    console.log(`[QoS Backend] Endpoints:`);
    console.log(`  - GET  /health`);
    console.log(`  - GET  /api/ping`);
    console.log(`  - GET  /api/download?sizeMb=5`);
    console.log(`  - POST /api/upload`);
    console.log(`  - GET  /api/info`);
  });
}
