/**
 * Computes statistical jitter according to RFC 3550 / RFC 2544.
 *
 * RFC 3550 formula:
 * D(i, j) = (R_j - R_i) - (S_j - S_i)
 * J(i) = J(i-1) + (|D(i-1, i)| - J(i-1)) / 16
 *
 * When only round-trip times (RTT) are sampled sequentially:
 * D(i, i-1) = RTT_i - RTT_{i-1}
 * J_new = J_prev + (|RTT_i - RTT_{i-1}| - J_prev) / 16
 */

export interface RttSample {
  rttMs: number;
  sendTimestampMs: number;
  receiveTimestampMs: number;
}

/**
 * Calculates continuous RFC 3550 interarrival jitter.
 */
export function calculateRfc3550Jitter(samples: number[]): number {
  if (samples.length < 2) return 0;

  let jitter = 0;
  for (let i = 1; i < samples.length; i++) {
    const diff = Math.abs(samples[i] - samples[i - 1]);
    jitter += (diff - jitter) / 16;
  }

  return Number(jitter.toFixed(2));
}

/**
 * Calculates Mean Absolute Deviation (MAD) Jitter (traditional ping jitter):
 * average difference between consecutive RTTs.
 */
export function calculateMeanConsecutiveJitter(samples: number[]): number {
  if (samples.length < 2) return 0;

  let totalDiff = 0;
  for (let i = 1; i < samples.length; i++) {
    totalDiff += Math.abs(samples[i] - samples[i - 1]);
  }

  return Number((totalDiff / (samples.length - 1)).toFixed(2));
}

/**
 * Computes standard metrics (min, max, avg, jitter, packet loss)
 */
export function computePingStatistics(
  host: string,
  samples: (number | null)[],
  totalSent: number
): {
  host: string;
  packetsSent: number;
  packetsReceived: number;
  packetLossPercent: number;
  minRttMs: number;
  maxRttMs: number;
  avgRttMs: number;
  jitterMs: number;
  samples: number[];
} {
  const validSamples = samples.filter((s): s is number => s !== null && s >= 0);
  const packetsReceived = validSamples.length;
  const packetsSent = Math.max(totalSent, packetsReceived);
  const packetLossPercent = packetsSent > 0 
    ? Number((((packetsSent - packetsReceived) / packetsSent) * 100).toFixed(1))
    : 0;

  if (validSamples.length === 0) {
    return {
      host,
      packetsSent,
      packetsReceived: 0,
      packetLossPercent: 100,
      minRttMs: 0,
      maxRttMs: 0,
      avgRttMs: 0,
      jitterMs: 0,
      samples: [],
    };
  }

  const minRttMs = Number(Math.min(...validSamples).toFixed(2));
  const maxRttMs = Number(Math.max(...validSamples).toFixed(2));
  const sum = validSamples.reduce((acc, curr) => acc + curr, 0);
  const avgRttMs = Number((sum / validSamples.length).toFixed(2));
  const jitterMs = calculateRfc3550Jitter(validSamples);

  return {
    host,
    packetsSent,
    packetsReceived,
    packetLossPercent,
    minRttMs,
    maxRttMs,
    avgRttMs,
    jitterMs,
    samples: validSamples,
  };
}
