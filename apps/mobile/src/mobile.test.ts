// Polyfill __DEV__ for React Native / Expo environment when executing under pure Node.js
(globalThis as any).__DEV__ = true;

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { TelephonyBridge } from './native/telephonyBridge.js';
import { HeatmapGenerator } from './geo/heatmapGenerator.js';
import { PersistenceRepository } from './persistence/storage.js';
import { PingEngine } from './engine/pingEngine.js';
import { ThroughputEngine } from './engine/throughputEngine.js';
import { useQoSStore } from './store/useQoSStore.js';
import { QoSMeasurementRecord, QoSDegradationAlert } from '@qos-monitor/contracts';

describe('Mobile App Unit & Integration Tests', () => {
  let mockServer: http.Server;
  let mockServerUrl: string;

  before(async () => {
    // Servidor HTTP local para pruebas de sondas y throughput
    mockServer = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

      if (url.pathname === '/api/ping') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ pong: true, serverTime: Date.now() }));
        return;
      }

      if (url.pathname === '/api/download') {
        const sizeMb = parseFloat(url.searchParams.get('sizeMb') || '1');
        const bytes = Math.floor(sizeMb * 1024 * 1024);
        res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Length': bytes.toString(),
        });
        const chunk = Buffer.alloc(32 * 1024, 0xaa);
        let sent = 0;
        while (sent < bytes) {
          const toSend = Math.min(chunk.length, bytes - sent);
          res.write(chunk.subarray(0, toSend));
          sent += toSend;
        }
        res.end();
        return;
      }

      if (url.pathname === '/api/upload' && req.method === 'POST') {
        let received = 0;
        req.on('data', (d) => {
          received += d.length;
        });
        req.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, bytesReceived: received }));
        });
        return;
      }

      res.writeHead(404);
      res.end('Not Found');
    });

    await new Promise<void>((resolve) => {
      mockServer.listen(0, '127.0.0.1', () => {
        const addr = mockServer.address();
        if (typeof addr === 'object' && addr !== null) {
          mockServerUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      mockServer.close(() => resolve());
    });
  });

  describe('TelephonyBridge (RF-01)', () => {
    test('loads realistic cellular parameters in fallback mode (5G)', async () => {
      TelephonyBridge.setMockScenario('EXCELLENT_5G');
      const info = await TelephonyBridge.getCellularInfo();

      assert.equal(info.connectionType, '5g');
      assert.equal(info.radio.operatorName, 'Claro 5G');
      assert.equal(info.radio.rssiDbm, -62);
      assert.equal(info.radio.band, 'n78 (3.5 GHz)');
      assert.ok(info.radio.rsrpDbm != null);
      assert.ok(info.radio.cellId != null && info.radio.cellId > 0);
    });

    test('switches dynamically between mock scenarios (3G / 4G / Offline)', async () => {
      TelephonyBridge.setMockScenario('CRITICAL_3G');
      const info3g = await TelephonyBridge.getCellularInfo();
      assert.equal(info3g.connectionType, '3g');
      assert.equal(info3g.radio.rssiDbm, -118);

      TelephonyBridge.setMockScenario('GOOD_4G');
      const info4g = await TelephonyBridge.getCellularInfo();
      assert.equal(info4g.connectionType, '4g');
      assert.equal(info4g.radio.operatorName, 'Personal 4G');
    });
  });

  describe('PingEngine (RF-02)', () => {
    test('probes single host and computes valid RTT and jitter statistics', async () => {
      const target = {
        name: 'Local Test Server',
        host: '127.0.0.1',
        url: `${mockServerUrl}/api/ping`,
      };

      const progressSamples: number[] = [];
      const stats = await PingEngine.probeHost(target, 3, (_seq, rtt) => {
        if (rtt != null) progressSamples.push(rtt);
      });

      assert.equal(stats.host, 'Local Test Server');
      assert.equal(stats.packetsSent, 3);
      assert.equal(stats.packetsReceived, 3);
      assert.equal(stats.packetLossPercent, 0);
      assert.ok(stats.minRttMs > 0);
      assert.ok(stats.maxRttMs >= stats.minRttMs);
      assert.ok(stats.avgRttMs > 0);
      assert.equal(progressSamples.length, 3);
    });

    test('probeAll executes across multiple targets and handles failures cleanly', async () => {
      const targets = [
        { name: 'Target OK', host: '127.0.0.1', url: `${mockServerUrl}/api/ping` },
        { name: 'Target Bad', host: '127.0.0.1', url: 'http://127.0.0.1:59999/unreachable' },
      ];

      const results = await PingEngine.probeAll(targets, 2);
      assert.equal(results.length, 2);

      const okTarget = results.find((r) => r.host === 'Target OK');
      assert.ok(okTarget);
      assert.equal(okTarget?.packetLossPercent, 0);

      const badTarget = results.find((r) => r.host === 'Target Bad');
      assert.ok(badTarget);
      assert.equal(badTarget?.packetLossPercent, 100);
      assert.equal(badTarget?.packetsReceived, 0);
    });
  });

  describe('ThroughputEngine (RF-03)', () => {
    test('runDownloadTest downloads binary payload and calculates speed in Mbps', async () => {
      let lastProgress = 0;
      const result = await ThroughputEngine.runDownloadTest(mockServerUrl, 1, (prog) => {
        lastProgress = prog.percent;
      });

      assert.equal(result.direction, 'download');
      assert.equal(result.bytesTransferred, 1 * 1024 * 1024);
      assert.ok(result.durationMs > 0);
      assert.ok(result.speedMbps > 0);
      assert.equal(lastProgress, 100);
    });

    test('runUploadTest uploads dummy payload and measures upload Mbps', async () => {
      let reportedStage = '';
      const result = await ThroughputEngine.runUploadTest(mockServerUrl, 1, (prog) => {
        reportedStage = prog.stage;
      });

      assert.equal(result.direction, 'upload');
      assert.equal(result.bytesTransferred, 1 * 1024 * 1024);
      assert.ok(result.durationMs > 0);
      assert.ok(result.speedMbps > 0);
      assert.equal(reportedStage, 'upload');
    });
  });

  describe('PersistenceRepository & History Filtering (RF-04, RF-08, RF-09)', () => {
    before(async () => {
      await PersistenceRepository.clearAll();
    });

    test('saves and filters measurements by network type, date, and bounding box', async () => {
      const baseTime = 1774464000000;
      const record5G: QoSMeasurementRecord = {
        id: 'rec-5g',
        sessionId: 'sess-1',
        timestamp: baseTime,
        network: {
          timestamp: baseTime,
          type: '5g',
          isConnected: true,
          isInternetReachable: true,
          ipAddress: '190.1.1.1',
          carrier: 'Claro',
          cellular: null,
          wifi: null,
        },
        pingSummary: [],
        location: { latitude: -32.4825, longitude: -58.2325, altitude: 25, accuracy: 5, speed: 0, timestamp: baseTime },
        qos: {
          score: 95,
          category: 'EXCELLENT',
          mosEstimated: 4.3,
          factors: { latencyScore: 95, jitterScore: 95, lossScore: 100, signalScore: 95, throughputScore: 95 },
        },
        isBackground: false,
      };

      const record4G: QoSMeasurementRecord = {
        id: 'rec-4g',
        sessionId: 'sess-1',
        timestamp: baseTime + 100000,
        network: {
          timestamp: baseTime + 100000,
          type: '4g',
          isConnected: true,
          isInternetReachable: true,
          ipAddress: '190.2.2.2',
          carrier: 'Personal',
          cellular: null,
          wifi: null,
        },
        pingSummary: [],
        location: { latitude: -34.6037, longitude: -58.3816, altitude: 10, accuracy: 5, speed: 0, timestamp: baseTime + 100000 },
        qos: {
          score: 75,
          category: 'GOOD',
          mosEstimated: 3.8,
          factors: { latencyScore: 75, jitterScore: 75, lossScore: 100, signalScore: 75, throughputScore: 75 },
        },
        isBackground: false,
      };

      await PersistenceRepository.saveMeasurement(record5G);
      await PersistenceRepository.saveMeasurement(record4G);

      const all = await PersistenceRepository.getMeasurements();
      assert.equal(all.length, 2);

      // Filtrar por red 5g
      const only5G = await PersistenceRepository.getMeasurements({ networkTypes: ['5g'] });
      assert.equal(only5G.length, 1);
      assert.equal(only5G[0].id, 'rec-5g');

      // Filtrar por rango de fecha
      const dateFiltered = await PersistenceRepository.getMeasurements({
        startDate: baseTime + 50000,
      });
      assert.equal(dateFiltered.length, 1);
      assert.equal(dateFiltered[0].id, 'rec-4g');

      // Filtrar por Bounding Box (alrededor de Concepción del Uruguay)
      const geoFiltered = await PersistenceRepository.getMeasurements({
        boundingBox: {
          minLat: -33.0,
          maxLat: -32.0,
          minLon: -59.0,
          maxLon: -58.0,
        },
      });
      assert.equal(geoFiltered.length, 1);
      assert.equal(geoFiltered[0].id, 'rec-5g');
    });

    test('stores and retrieves degradation alerts and sessions', async () => {
      const alert: QoSDegradationAlert = {
        id: 'alt-1',
        timestamp: Date.now(),
        metricName: 'rtt',
        actualValue: 350,
        thresholdValue: 300,
        severity: 'CRITICAL',
        reason: 'Latencia excesiva detectada (> 300 ms)',
      };

      await PersistenceRepository.saveAlert(alert);
      const alerts = await PersistenceRepository.getAlerts();
      assert.ok(alerts.length >= 1);
      assert.equal(alerts[0].id, 'alt-1');
    });
  });

  describe('HeatmapGenerator (RF-05)', () => {
    test('generates weighted points based on QoS Score and Signal RSSI', () => {
      const dummyRecords: QoSMeasurementRecord[] = [
        {
          id: 'pt-1',
          sessionId: 's1',
          timestamp: 1000,
          network: {
            timestamp: 1000,
            type: '4g',
            isConnected: true,
            isInternetReachable: true,
            ipAddress: null,
            carrier: 'Personal',
            cellular: {
              operatorName: 'Personal',
              simState: 'READY',
              mcc: '722',
              mnc: '34',
              rssiDbm: -70,
              rsrpDbm: -80,
              rsrqDb: -9,
              sinrDb: 18,
              asuLevel: 50,
              cellId: 1,
              lacTac: 1,
              band: 'B28',
              isRoaming: false,
            },
            wifi: null,
          },
          pingSummary: [],
          location: { latitude: -32.48, longitude: -58.23, altitude: 20, accuracy: 5, speed: 0, timestamp: 1000 },
          qos: {
            score: 85,
            category: 'EXCELLENT',
            mosEstimated: 4.0,
            factors: { latencyScore: 85, jitterScore: 85, lossScore: 100, signalScore: 85, throughputScore: 85 },
          },
          isBackground: false,
        },
      ];

      const qosPoints = HeatmapGenerator.generatePoints(dummyRecords, 'QOS_SCORE');
      assert.equal(qosPoints.length, 1);
      assert.equal(qosPoints[0].weight, 0.85);

      const rssiPoints = HeatmapGenerator.generatePoints(dummyRecords, 'SIGNAL_RSSI');
      assert.equal(rssiPoints.length, 1);
      assert.ok(rssiPoints[0].weight > 0.7);
    });
  });

  describe('Reactive State Store (useQoSStore)', () => {
    test('initializes and manages state, settings and demo data', async () => {
      const store = useQoSStore.getState();

      store.updateSettings({
        downloadSizeMb: 1,
        uploadSizeMb: 1,
        backendUrl: mockServerUrl,
      });

      const updated = useQoSStore.getState();
      assert.equal(updated.downloadSizeMb, 1);
      assert.equal(updated.uploadSizeMb, 1);
      assert.equal(updated.backendUrl, mockServerUrl);

      // Ejecutar un ciclo completo de prueba QoS
      const measurement = await store.runFullQoSTest('Test de verificación integral');
      assert.ok(measurement !== null, 'Measurement should be generated');
      assert.ok(measurement?.qos.score != null);
      assert.ok(measurement?.throughput?.download?.speedMbps != null);
      assert.ok(measurement?.throughput?.upload?.speedMbps != null);

      const afterState = useQoSStore.getState();
      assert.equal(afterState.isTesting, false);
      assert.equal(afterState.activeTestStage, 'completed');
      assert.ok(afterState.measurements.length >= 1);
    });
  });
});
