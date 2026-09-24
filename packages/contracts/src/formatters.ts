import { QoSMeasurementRecord } from './types.js';

/**
 * Converts a list of QoS measurement records to an RFC 4180-compliant CSV string.
 */
export function exportMeasurementsToCsv(records: QoSMeasurementRecord[]): string {
  const headers = [
    'id',
    'sessionId',
    'timestamp_iso',
    'timestamp_unix',
    'network_type',
    'is_connected',
    'carrier_operator',
    'rssi_dbm',
    'rsrp_dbm',
    'cell_id',
    'lac_tac',
    'ping_target_host',
    'avg_rtt_ms',
    'min_rtt_ms',
    'max_rtt_ms',
    'jitter_ms',
    'packet_loss_pct',
    'download_mbps',
    'upload_mbps',
    'latitude',
    'longitude',
    'altitude',
    'accuracy_meters',
    'qos_score',
    'qos_category',
    'mos_estimated',
    'is_background',
    'notes'
  ];

  const escapeCsv = (val: unknown): string => {
    if (val == null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = records.map((r) => {
    const primaryPing = r.pingSummary && r.pingSummary.length > 0 ? r.pingSummary[0] : null;
    const isoDate = new Date(r.timestamp).toISOString();

    return [
      escapeCsv(r.id),
      escapeCsv(r.sessionId),
      escapeCsv(isoDate),
      escapeCsv(r.timestamp),
      escapeCsv(r.network?.type ?? 'unknown'),
      escapeCsv(r.network?.isConnected ?? false),
      escapeCsv(r.network?.carrier ?? r.network?.cellular?.operatorName ?? ''),
      escapeCsv(r.network?.cellular?.rssiDbm ?? ''),
      escapeCsv(r.network?.cellular?.rsrpDbm ?? ''),
      escapeCsv(r.network?.cellular?.cellId ?? ''),
      escapeCsv(r.network?.cellular?.lacTac ?? ''),
      escapeCsv(primaryPing?.host ?? ''),
      escapeCsv(primaryPing?.avgRttMs ?? ''),
      escapeCsv(primaryPing?.minRttMs ?? ''),
      escapeCsv(primaryPing?.maxRttMs ?? ''),
      escapeCsv(primaryPing?.jitterMs ?? ''),
      escapeCsv(primaryPing?.packetLossPercent ?? ''),
      escapeCsv(r.throughput?.download?.speedMbps ?? ''),
      escapeCsv(r.throughput?.upload?.speedMbps ?? ''),
      escapeCsv(r.location?.latitude ?? ''),
      escapeCsv(r.location?.longitude ?? ''),
      escapeCsv(r.location?.altitude ?? ''),
      escapeCsv(r.location?.accuracy ?? ''),
      escapeCsv(r.qos?.score ?? ''),
      escapeCsv(r.qos?.category ?? ''),
      escapeCsv(r.qos?.mosEstimated ?? ''),
      escapeCsv(r.isBackground ? 'true' : 'false'),
      escapeCsv(r.notes ?? ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Converts records to formatted JSON with metadata wrapper.
 */
export function exportMeasurementsToJson(
  records: QoSMeasurementRecord[],
  metadata?: { exportedAt?: number; appVersion?: string; author?: string }
): string {
  const exportPayload = {
    metadata: {
      exportedAt: metadata?.exportedAt ?? Date.now(),
      exportedAtIso: new Date(metadata?.exportedAt ?? Date.now()).toISOString(),
      appVersion: metadata?.appVersion ?? '1.0.0',
      totalRecords: records.length,
      ...metadata,
    },
    measurements: records,
  };

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Format bytes to readable string (KB, MB)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format speed in Mbps
 */
export function formatSpeed(mbps?: number | null): string {
  if (mbps == null || isNaN(mbps)) return '-- Mbps';
  return `${mbps.toFixed(2)} Mbps`;
}

/**
 * Format latency in ms
 */
export function formatLatency(ms?: number | null): string {
  if (ms == null || isNaN(ms)) return '-- ms';
  return `${ms.toFixed(1)} ms`;
}

/**
 * Format signal strength in dBm
 */
export function formatDbm(dbm?: number | null): string {
  if (dbm == null || isNaN(dbm)) return '-- dBm';
  return `${Math.round(dbm)} dBm`;
}
