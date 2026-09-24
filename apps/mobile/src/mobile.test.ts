import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TelephonyBridge } from './native/telephonyBridge.js';
import { HeatmapGenerator } from './geo/heatmapGenerator.js';
import { PersistenceRepository } from './persistence/storage.js';
import { QoSMeasurementRecord } from '@qos-monitor/contracts';

describe('Mobile App Unit Tests', () => {
  test('TelephonyBridge loads realistic cellular parameters in fallback mode', async () => {
    TelephonyBridge.setMockScenario('EXCELLENT_5G');
    const info = await TelephonyBridge.getCellularInfo();

    assert.equal(info.connectionType, '5g');
    assert.equal(info.radio.operatorName, 'Claro 5G');
    assert.equal(info.radio.rssiDbm, -62);
    assert.equal(info.radio.band, 'n78 (3.5 GHz)');
  });

  test('TelephonyBridge can switch to weak signal scenario', async () => {
    TelephonyBridge.setMockScenario('CRITICAL_3G');
    const info = await TelephonyBridge.getCellularInfo();

    assert.equal(info.connectionType, '3g');
    assert.equal(info.radio.rssiDbm, -118);
  });

  test('PersistenceRepository saves and filters measurements by network type', async () => {
    await PersistenceRepository.clearAll();

    const dummy: QoSMeasurementRecord = {
      id: 'test-1',
      sessionId: 'sess-1',
      timestamp: Date.now(),
      network: {
        timestamp: Date.now(),
        type: '5g',
        isConnected: true,
        isInternetReachable: true,
        ipAddress: '190.1.1.1',
        carrier: 'Claro',
        cellular: null,
        wifi: null,
      },
      pingSummary: [],
      qos: {
        score: 90,
        category: 'EXCELLENT',
        mosEstimated: 4.1,
        factors: { latencyScore: 90, jitterScore: 90, lossScore: 100, signalScore: 90, throughputScore: 90 },
      },
      isBackground: false,
    };

    await PersistenceRepository.saveMeasurement(dummy);

    const all = await PersistenceRepository.getMeasurements();
    assert.equal(all.length, 1);

    const filtered5G = await PersistenceRepository.getMeasurements({ networkTypes: ['5g'] });
    assert.equal(filtered5G.length, 1);

    const filtered3G = await PersistenceRepository.getMeasurements({ networkTypes: ['3g'] });
    assert.equal(filtered3G.length, 0);
  });

  test('HeatmapGenerator generates weighted points based on QoS Score and Signal RSSI', () => {
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
