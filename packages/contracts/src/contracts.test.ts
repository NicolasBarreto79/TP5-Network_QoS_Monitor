import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRfc3550Jitter,
  computePingStatistics,
  scoreLatency,
  calculateQoSCompoundScore,
  detectDegradations,
  calculateHaversineDistanceMeters,
  isPointInBoundingBox,
  createHeatmapPoint,
  exportMeasurementsToCsv,
  exportMeasurementsToJson,
  QoSMeasurementRecord,
} from './index.js';

describe('RFC 3550 Jitter and Ping Statistics', () => {
  test('calculates zero jitter for constant RTT', () => {
    const samples = [20, 20, 20, 20, 20];
    const jitter = calculateRfc3550Jitter(samples);
    assert.equal(jitter, 0);
  });

  test('calculates correct RFC 3550 interarrival jitter convergence', () => {
    // 20ms -> 36ms (diff 16). Jitter becomes 0 + (16 - 0)/16 = 1.0
    const samples = [20, 36];
    const jitter = calculateRfc3550Jitter(samples);
    assert.equal(jitter, 1.0);
  });

  test('computes complete ping statistics with min, max, avg, loss, jitter', () => {
    const stats = computePingStatistics('1.1.1.1', [10, 20, 30, null], 4);
    assert.equal(stats.host, '1.1.1.1');
    assert.equal(stats.packetsSent, 4);
    assert.equal(stats.packetsReceived, 3);
    assert.equal(stats.packetLossPercent, 25.0);
    assert.equal(stats.minRttMs, 10);
    assert.equal(stats.maxRttMs, 30);
    assert.equal(stats.avgRttMs, 20);
    assert.ok(stats.jitterMs > 0);
  });

  test('handles 100% packet loss gracefully', () => {
    const stats = computePingStatistics('8.8.8.8', [null, null, null], 3);
    assert.equal(stats.packetsSent, 3);
    assert.equal(stats.packetsReceived, 0);
    assert.equal(stats.packetLossPercent, 100);
    assert.equal(stats.avgRttMs, 0);
  });
});

describe('QoS Scoring and Degradation Detection', () => {
  test('scoreLatency gives 100 for optimal RTT and scales down', () => {
    assert.equal(scoreLatency(15), 100);
    assert.ok(scoreLatency(100) < 100 && scoreLatency(100) > 40);
    assert.ok(scoreLatency(400) <= 10);
  });

  test('calculates compound QoS score and maps to category and MOS', () => {
    const qosExcellent = calculateQoSCompoundScore({
      avgRttMs: 18,
      jitterMs: 2,
      packetLossPercent: 0,
      rssiDbm: -60,
      downloadMbps: 85,
    });

    assert.equal(qosExcellent.category, 'EXCELLENT');
    assert.ok(qosExcellent.score >= 85);
    assert.ok(qosExcellent.mosEstimated >= 4.0);

    const qosDegraded = calculateQoSCompoundScore({
      avgRttMs: 380,
      jitterMs: 65,
      packetLossPercent: 12,
      rssiDbm: -116,
      downloadMbps: 0.8,
    });

    assert.ok(qosDegraded.score < 40);
    assert.ok(['POOR', 'CRITICAL'].includes(qosDegraded.category));
    assert.ok(qosDegraded.mosEstimated < 2.5);
  });

  test('detects critical degradation alerts when metrics breach thresholds', () => {
    const alerts = detectDegradations({
      avgRttMs: 350, // Critical (>300)
      jitterMs: 70, // Critical (>60)
      packetLossPercent: 15, // Critical (>10)
      rssiDbm: -120, // Critical (< -118)
      downloadMbps: 0.5, // Critical (< 1.5)
    });

    assert.ok(alerts.length >= 4);
    assert.ok(alerts.some((a) => a.metricName === 'rtt' && a.severity === 'CRITICAL'));
    assert.ok(alerts.some((a) => a.metricName === 'packet_loss' && a.severity === 'CRITICAL'));
    assert.ok(alerts.some((a) => a.metricName === 'rssi' && a.severity === 'CRITICAL'));
  });
});

describe('Geographic Utilities and Heatmap', () => {
  test('calculates accurate Haversine distance between two points', () => {
    // Buenos Aires (-34.6037, -58.3816) to La Plata (-34.9205, -57.9536) ~ 53 km
    const dist = calculateHaversineDistanceMeters(
      -34.6037,
      -58.3816,
      -34.9205,
      -57.9536
    );
    assert.ok(dist > 50000 && dist < 60000, `Expected ~53000m, got ${dist}`);
  });

  test('verifies point in bounding box', () => {
    const box = {
      minLat: -34.65,
      maxLat: -34.55,
      minLon: -58.45,
      maxLon: -58.35,
    };

    assert.equal(
      isPointInBoundingBox({ latitude: -34.60, longitude: -58.40 }, box),
      true
    );
    assert.equal(
      isPointInBoundingBox({ latitude: -34.70, longitude: -58.40 }, box),
      false
    );
  });

  test('creates Heatmap point with normalized weight', () => {
    const hpHigh = createHeatmapPoint({
      latitude: -34.60,
      longitude: -58.38,
      qosScore: 95,
      networkType: '5g',
      rssiDbm: -65,
    });
    assert.equal(hpHigh.weight, 0.95);
    assert.equal(hpHigh.networkType, '5g');

    const hpLow = createHeatmapPoint({
      latitude: -34.60,
      longitude: -58.38,
      qosScore: 5,
      networkType: '3g',
      rssiDbm: -115,
    });
    assert.equal(hpLow.weight, 0.1); // min clamp
  });
});

describe('Export Formatters (CSV / JSON)', () => {
  const dummyRecord: QoSMeasurementRecord = {
    id: 'meas-001',
    sessionId: 'sess-001',
    timestamp: 1774464000000,
    network: {
      timestamp: 1774464000000,
      type: '4g',
      isConnected: true,
      isInternetReachable: true,
      ipAddress: '190.18.20.10',
      carrier: 'Personal 4G',
      cellular: {
        operatorName: 'Personal',
        simState: 'READY',
        mcc: '722',
        mnc: '34',
        rssiDbm: -82,
        rsrpDbm: -92,
        rsrqDb: -8,
        sinrDb: 18,
        asuLevel: 48,
        cellId: 104859,
        lacTac: 3012,
        band: 'B28',
        isRoaming: false,
      },
      wifi: null,
    },
    pingSummary: [
      {
        host: '1.1.1.1',
        packetsSent: 10,
        packetsReceived: 10,
        packetLossPercent: 0,
        minRttMs: 18.2,
        maxRttMs: 25.4,
        avgRttMs: 21.3,
        jitterMs: 1.8,
        samples: [20, 22, 19, 21],
      },
    ],
    throughput: {
      download: {
        direction: 'download',
        bytesTransferred: 5242880,
        durationMs: 820,
        speedMbps: 51.15,
        serverUrl: 'http://localhost:3000/api/download',
        timestamp: 1774464001000,
      },
    },
    location: {
      latitude: -32.4825,
      longitude: -58.2325,
      altitude: 25,
      accuracy: 4.5,
      speed: 0,
      timestamp: 1774464000000,
    },
    qos: {
      score: 88,
      category: 'EXCELLENT',
      mosEstimated: 4.09,
      factors: {
        latencyScore: 92,
        jitterScore: 98,
        lossScore: 100,
        signalScore: 82,
        throughputScore: 95,
      },
    },
    isBackground: false,
    notes: 'Medicion de prueba inicial',
  };

  test('exports measurements to valid CSV', () => {
    const csv = exportMeasurementsToCsv([dummyRecord]);
    assert.ok(csv.includes('meas-001'));
    assert.ok(csv.includes('Personal'));
    assert.ok(csv.includes('51.15'));
    assert.ok(csv.includes('-32.4825'));
    assert.ok(csv.startsWith('id,sessionId,timestamp_iso'));
  });

  test('exports measurements to JSON with metadata', () => {
    const jsonStr = exportMeasurementsToJson([dummyRecord], { author: 'Nicolas Barreto' });
    const parsed = JSON.parse(jsonStr);
    assert.equal(parsed.metadata.totalRecords, 1);
    assert.equal(parsed.metadata.author, 'Nicolas Barreto');
    assert.equal(parsed.measurements[0].id, 'meas-001');
  });
});
