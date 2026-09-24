import { 
  QoSMeasurementRecord, 
  HeatmapPoint, 
  createHeatmapPoint,
  ConnectionType 
} from '@qos-monitor/contracts';

export type HeatmapMetricMode = 'QOS_SCORE' | 'SIGNAL_RSSI' | 'LATENCY_RTT';

export class HeatmapGenerator {
  /**
   * Genera el conjunto de puntos ponderados para la capa de Heatmap Overlay de react-native-maps
   */
  static generatePoints(
    records: QoSMeasurementRecord[],
    mode: HeatmapMetricMode = 'QOS_SCORE',
    filterNetwork?: ConnectionType
  ): HeatmapPoint[] {
    let filtered = records.filter((r) => r.location != null);

    if (filterNetwork) {
      filtered = filtered.filter((r) => r.network.type === filterNetwork);
    }

    return filtered.map((r) => {
      const loc = r.location!;
      let weight = 0.5;

      switch (mode) {
        case 'QOS_SCORE':
          weight = r.qos.score / 100;
          break;
        case 'SIGNAL_RSSI': {
          const rssi = r.network.cellular?.rssiDbm ?? -95;
          // Normaliza -120 dBm (0.0) a -60 dBm (1.0)
          weight = Math.max(0.1, Math.min(1.0, (rssi + 120) / 60));
          break;
        }
        case 'LATENCY_RTT': {
          const rtt = r.pingSummary?.[0]?.avgRttMs ?? 50;
          // Menor latencia = mayor calidad (peso 1.0 para <=20ms, peso 0.1 para >=300ms)
          weight = Math.max(0.1, Math.min(1.0, 1.0 - Math.min(rtt, 300) / 300));
          break;
        }
      }

      return {
        latitude: loc.latitude,
        longitude: loc.longitude,
        weight: Number(weight.toFixed(2)),
        qosScore: r.qos.score,
        networkType: r.network.type,
        rssiDbm: r.network.cellular?.rssiDbm,
        timestamp: r.timestamp,
      };
    });
  }
}
