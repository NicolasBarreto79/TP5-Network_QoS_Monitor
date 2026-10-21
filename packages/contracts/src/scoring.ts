import { 
  QoSCompoundScore, 
  QoSCategory, 
  QoSDegradationAlert 
} from './types.js';

export interface DegradationThresholds {
  rttWarningMs: number;
  rttCriticalMs: number;
  jitterWarningMs: number;
  jitterCriticalMs: number;
  lossWarningPercent: number;
  lossCriticalPercent: number;
  rssiWarningDbm: number;
  rssiCriticalDbm: number;
  throughputWarningMbps: number;
  throughputCriticalMbps: number;
}

export const DEFAULT_THRESHOLDS: DegradationThresholds = {
  rttWarningMs: 150,
  rttCriticalMs: 300,
  jitterWarningMs: 30,
  jitterCriticalMs: 60,
  lossWarningPercent: 3.0,
  lossCriticalPercent: 10.0,
  rssiWarningDbm: -105,
  rssiCriticalDbm: -118,
  throughputWarningMbps: 5.0,
  throughputCriticalMbps: 1.5,
};

/**
 * Calculates latency score (0 - 100)
 * Ideal <= 25ms, Acceptable <= 100ms, Poor >= 300ms
 */
export function scoreLatency(rttMs: number): number {
  if (rttMs <= 0) return 0;
  if (rttMs <= 25) return 100;
  if (rttMs <= 70) return 90 - ((rttMs - 25) / 45) * 20; // 90 -> 70
  if (rttMs <= 150) return 70 - ((rttMs - 70) / 80) * 25; // 70 -> 45
  if (rttMs <= 350) return 45 - ((rttMs - 150) / 200) * 35; // 45 -> 10
  return Math.max(0, 10 - ((rttMs - 350) / 300) * 10);
}

/**
 * Calculates jitter score (0 - 100)
 * Ideal <= 5ms, Acceptable <= 20ms, Poor >= 60ms
 */
export function scoreJitter(jitterMs: number): number {
  if (jitterMs <= 0) return 100;
  if (jitterMs <= 5) return 100;
  if (jitterMs <= 20) return 95 - ((jitterMs - 5) / 15) * 25; // 95 -> 70
  if (jitterMs <= 50) return 70 - ((jitterMs - 20) / 30) * 35; // 70 -> 35
  return Math.max(0, 35 - ((jitterMs - 50) / 50) * 35);
}

/**
 * Calculates packet loss score (0 - 100)
 * 0% -> 100, 2% -> 80, 5% -> 50, 10% -> 10
 */
export function scoreLoss(lossPercent: number): number {
  if (lossPercent <= 0) return 100;
  if (lossPercent <= 1) return 90;
  if (lossPercent <= 3) return 75;
  if (lossPercent <= 5) return 50;
  if (lossPercent <= 10) return 20;
  return 0;
}

/**
 * Calculates signal strength score (0 - 100) based on RSSI in dBm
 * Cell: >= -70 excellent, -70..-85 good, -85..-100 fair, -100..-115 poor, < -115 critical
 */
export function scoreSignal(rssiDbm?: number | null): number {
  if (rssiDbm == null || isNaN(rssiDbm)) return 70; // Neutral fallback when not available
  if (rssiDbm >= -65) return 100;
  if (rssiDbm >= -80) return 85 + ((rssiDbm + 80) / 15) * 15;
  if (rssiDbm >= -95) return 60 + ((rssiDbm + 95) / 15) * 25;
  if (rssiDbm >= -110) return 30 + ((rssiDbm + 110) / 15) * 30;
  return Math.max(0, ((rssiDbm + 125) / 15) * 30);
}

/**
 * Calculates throughput score (0 - 100)
 * >= 50 Mbps: 100, 20 Mbps: 80, 5 Mbps: 50, 1 Mbps: 20
 */
export function scoreThroughput(downloadMbps?: number): number {
  if (downloadMbps == null) return 70; // Neutral if not run
  if (downloadMbps >= 50) return 100;
  if (downloadMbps >= 20) return 80 + ((downloadMbps - 20) / 30) * 20;
  if (downloadMbps >= 5) return 50 + ((downloadMbps - 5) / 15) * 30;
  if (downloadMbps >= 1) return 20 + ((downloadMbps - 1) / 4) * 30;
  return Math.max(0, downloadMbps * 20);
}

/**
 * ITU-T E-Model / MOS calculation approximation for VoIP/Video QoS
 */
export function estimateMos(score: number): number {
  // Score 0..100 maps to 1.0..4.5 MOS
  const mos = 1.0 + (score / 100) * 3.4;
  return Number(Math.min(4.5, Math.max(1.0, mos)).toFixed(2));
}

export function determineCategory(score: number): QoSCategory {
  if (score >= 85) return 'EXCELLENT';
  if (score >= 70) return 'GOOD';
  if (score >= 50) return 'FAIR';
  if (score >= 30) return 'POOR';
  return 'CRITICAL';
}

/**
 * Computes compound QoS score
 */
export function calculateQoSCompoundScore(params: {
  avgRttMs?: number;
  jitterMs?: number;
  packetLossPercent?: number;
  rssiDbm?: number | null;
  downloadMbps?: number;
}): QoSCompoundScore {
  const latencyScore = params.avgRttMs != null ? scoreLatency(params.avgRttMs) : 75;
  const jitterScore = params.jitterMs != null ? scoreJitter(params.jitterMs) : 80;
  const lossScore = params.packetLossPercent != null ? scoreLoss(params.packetLossPercent) : 100;
  const signalScore = scoreSignal(params.rssiDbm);
  const throughputScore = scoreThroughput(params.downloadMbps);

  // Weights: Latency 25%, Jitter 20%, Loss 25%, Signal 15%, Throughput 15%
  const totalScore = 
    latencyScore * 0.25 +
    jitterScore * 0.20 +
    lossScore * 0.25 +
    signalScore * 0.15 +
    throughputScore * 0.15;

  const scoreRounded = Math.round(Math.min(100, Math.max(0, totalScore)));
  const category = determineCategory(scoreRounded);
  const mosEstimated = estimateMos(scoreRounded);

  return {
    score: scoreRounded,
    category,
    mosEstimated,
    factors: {
      latencyScore: Math.round(latencyScore),
      jitterScore: Math.round(jitterScore),
      lossScore: Math.round(lossScore),
      signalScore: Math.round(signalScore),
      throughputScore: Math.round(throughputScore),
    },
  };
}

/**
 * Checks for severe network degradations based on thresholds (RF-07)
 */
export function detectDegradations(
  metrics: {
    avgRttMs?: number;
    jitterMs?: number;
    packetLossPercent?: number;
    rssiDbm?: number | null;
    downloadMbps?: number;
  },
  thresholds: DegradationThresholds = DEFAULT_THRESHOLDS
): QoSDegradationAlert[] {
  const alerts: QoSDegradationAlert[] = [];
  const now = Date.now();

  // 1. Packet Loss check
  if (metrics.packetLossPercent != null) {
    if (metrics.packetLossPercent >= thresholds.lossCriticalPercent) {
      alerts.push({
        id: `alert-loss-${now}`,
        timestamp: now,
        severity: 'CRITICAL',
        reason: `Pérdida crítica de paquetes (${metrics.packetLossPercent}% >= ${thresholds.lossCriticalPercent}%)`,
        metricName: 'packet_loss',
        thresholdValue: thresholds.lossCriticalPercent,
        actualValue: metrics.packetLossPercent,
      });
    } else if (metrics.packetLossPercent >= thresholds.lossWarningPercent) {
      alerts.push({
        id: `alert-loss-${now}`,
        timestamp: now,
        severity: 'WARNING',
        reason: `Pérdida moderada de paquetes (${metrics.packetLossPercent}% >= ${thresholds.lossWarningPercent}%)`,
        metricName: 'packet_loss',
        thresholdValue: thresholds.lossWarningPercent,
        actualValue: metrics.packetLossPercent,
      });
    }
  }

  // 2. RTT / Latency check
  if (metrics.avgRttMs != null && metrics.avgRttMs > 0) {
    if (metrics.avgRttMs >= thresholds.rttCriticalMs) {
      alerts.push({
        id: `alert-rtt-${now}`,
        timestamp: now,
        severity: 'CRITICAL',
        reason: `Latencia crítica (${metrics.avgRttMs}ms >= ${thresholds.rttCriticalMs}ms)`,
        metricName: 'rtt',
        thresholdValue: thresholds.rttCriticalMs,
        actualValue: metrics.avgRttMs,
      });
    } else if (metrics.avgRttMs >= thresholds.rttWarningMs) {
      alerts.push({
        id: `alert-rtt-${now}`,
        timestamp: now,
        severity: 'WARNING',
        reason: `Latencia elevada (${metrics.avgRttMs}ms >= ${thresholds.rttWarningMs}ms)`,
        metricName: 'rtt',
        thresholdValue: thresholds.rttWarningMs,
        actualValue: metrics.avgRttMs,
      });
    }
  }

  // 3. Jitter check
  if (metrics.jitterMs != null && metrics.jitterMs > 0) {
    if (metrics.jitterMs >= thresholds.jitterCriticalMs) {
      alerts.push({
        id: `alert-jitter-${now}`,
        timestamp: now,
        severity: 'CRITICAL',
        reason: `Inestabilidad de jitter crítica (${metrics.jitterMs}ms >= ${thresholds.jitterCriticalMs}ms)`,
        metricName: 'jitter',
        thresholdValue: thresholds.jitterCriticalMs,
        actualValue: metrics.jitterMs,
      });
    } else if (metrics.jitterMs >= thresholds.jitterWarningMs) {
      alerts.push({
        id: `alert-jitter-${now}`,
        timestamp: now,
        severity: 'WARNING',
        reason: `Inestabilidad de jitter moderada (${metrics.jitterMs}ms >= ${thresholds.jitterWarningMs}ms)`,
        metricName: 'jitter',
        thresholdValue: thresholds.jitterWarningMs,
        actualValue: metrics.jitterMs,
      });
    }
  }

  // 4. RSSI Signal check
  if (metrics.rssiDbm != null) {
    if (metrics.rssiDbm <= thresholds.rssiCriticalDbm) {
      alerts.push({
        id: `alert-rssi-${now}`,
        timestamp: now,
        severity: 'CRITICAL',
        reason: `Intensidad de señal crítica (${metrics.rssiDbm} dBm <= ${thresholds.rssiCriticalDbm} dBm)`,
        metricName: 'rssi',
        thresholdValue: thresholds.rssiCriticalDbm,
        actualValue: metrics.rssiDbm,
      });
    } else if (metrics.rssiDbm <= thresholds.rssiWarningDbm) {
      alerts.push({
        id: `alert-rssi-${now}`,
        timestamp: now,
        severity: 'WARNING',
        reason: `Señal de red débil (${metrics.rssiDbm} dBm <= ${thresholds.rssiWarningDbm} dBm)`,
        metricName: 'rssi',
        thresholdValue: thresholds.rssiWarningDbm,
        actualValue: metrics.rssiDbm,
      });
    }
  }

  // 5. Throughput check
  if (metrics.downloadMbps != null && metrics.downloadMbps > 0) {
    if (metrics.downloadMbps <= thresholds.throughputCriticalMbps) {
      alerts.push({
        id: `alert-tput-${now}`,
        timestamp: now,
        severity: 'CRITICAL',
        reason: `Velocidad de descarga crítica (${metrics.downloadMbps} Mbps <= ${thresholds.throughputCriticalMbps} Mbps)`,
        metricName: 'throughput',
        thresholdValue: thresholds.throughputCriticalMbps,
        actualValue: metrics.downloadMbps,
      });
    } else if (metrics.downloadMbps <= thresholds.throughputWarningMbps) {
      alerts.push({
        id: `alert-tput-${now}`,
        timestamp: now,
        severity: 'WARNING',
        reason: `Velocidad de descarga reducida (${metrics.downloadMbps} Mbps <= ${thresholds.throughputWarningMbps} Mbps)`,
        metricName: 'throughput',
        thresholdValue: thresholds.throughputWarningMbps,
        actualValue: metrics.downloadMbps,
      });
    }
  }

  return alerts;
}
