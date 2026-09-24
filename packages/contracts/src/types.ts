export type ConnectionType = 
  | 'wifi' 
  | '2g' 
  | '3g' 
  | '4g' 
  | '5g' 
  | 'ethernet' 
  | 'unknown' 
  | 'none';

export interface RadioDetails {
  operatorName: string;
  simState: string;
  mcc: string | null;
  mnc: string | null;
  rssiDbm: number;
  rsrpDbm: number | null;
  rsrqDb: number | null;
  sinrDb: number | null;
  asuLevel: number | null;
  cellId: number | null;
  lacTac: number | null;
  band: string | null;
  isRoaming: boolean;
}

export interface WifiDetails {
  ssid: string | null;
  bssid: string | null;
  frequencyMhz: number | null;
  linkSpeedMbps: number | null;
  rssiDbm: number | null;
}

export interface NetworkSnapshot {
  timestamp: number;
  type: ConnectionType;
  isConnected: boolean;
  isInternetReachable: boolean;
  ipAddress: string | null;
  carrier: string | null;
  cellular: RadioDetails | null;
  wifi: WifiDetails | null;
}

export interface PingProbe {
  host: string;
  port: number;
  seq: number;
  rttMs: number;
  timestamp: number;
  success: boolean;
  errorMessage?: string;
}

export interface PingStats {
  host: string;
  packetsSent: number;
  packetsReceived: number;
  packetLossPercent: number;
  minRttMs: number;
  maxRttMs: number;
  avgRttMs: number;
  jitterMs: number;
  samples: number[];
}

export interface ThroughputResult {
  direction: 'download' | 'upload';
  bytesTransferred: number;
  durationMs: number;
  speedMbps: number;
  serverUrl: string;
  timestamp: number;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  speed: number | null;
  timestamp: number;
}

export type QoSCategory = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';

export interface QoSCompoundScore {
  score: number; // 0 to 100
  category: QoSCategory;
  mosEstimated: number; // 1.0 to 5.0 (ITU-T standard estimation)
  factors: {
    latencyScore: number;
    jitterScore: number;
    lossScore: number;
    throughputScore: number;
    signalScore: number;
  };
}

export interface QoSMeasurementRecord {
  id: string;
  sessionId: string;
  timestamp: number;
  network: NetworkSnapshot;
  pingSummary: PingStats[];
  throughput?: {
    download?: ThroughputResult;
    upload?: ThroughputResult;
  };
  location?: GeoPoint;
  qos: QoSCompoundScore;
  isBackground: boolean;
  notes?: string;
}

export interface QoSDegradationAlert {
  id: string;
  timestamp: number;
  severity: 'WARNING' | 'CRITICAL';
  reason: string;
  metricName: 'rtt' | 'jitter' | 'packet_loss' | 'rssi' | 'throughput';
  thresholdValue: number;
  actualValue: number;
  measurementId?: string;
}

export interface QoSSession {
  id: string;
  startTime: number;
  endTime: number | null;
  name: string;
  totalMeasurements: number;
  avgQoSScore: number;
  networkTypeSummary: Record<string, number>;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface HistoryFilters {
  startDate?: number;
  endDate?: number;
  networkTypes?: ConnectionType[];
  minQosScore?: number;
  boundingBox?: BoundingBox;
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number; // 0.0 to 1.0
  qosScore: number;
  networkType: ConnectionType;
  rssiDbm?: number;
  timestamp: number;
}
