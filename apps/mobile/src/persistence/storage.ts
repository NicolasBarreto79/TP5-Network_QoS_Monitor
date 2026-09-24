import {
  QoSMeasurementRecord,
  QoSSession,
  QoSDegradationAlert,
  HistoryFilters,
  isPointInBoundingBox,
} from '@qos-monitor/contracts';

const memoryStore = new Map<string, string>();

let AsyncStorageSafe: {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, val: string) => Promise<void>;
  multiRemove: (keys: string[]) => Promise<void>;
} = {
  getItem: async (key: string) => memoryStore.get(key) ?? null,
  setItem: async (key: string, val: string) => {
    memoryStore.set(key, val);
  },
  multiRemove: async (keys: string[]) => {
    keys.forEach((k) => memoryStore.delete(k));
  },
};

try {
  // Only load @react-native-async-storage if running in React Native runtime or browser
  const hasWindow = typeof (globalThis as any).window !== 'undefined' && Boolean((globalThis as any).window?.localStorage);
  const hasRNBridge = typeof (globalThis as any).nativeCallSyncHook !== 'undefined';
  if (hasWindow || hasRNBridge) {
    const mod = require('@react-native-async-storage/async-storage');
    if (mod && mod.default) {
      AsyncStorageSafe = mod.default;
    }
  }
} catch {
  // Use in-memory store in tests
}

const STORAGE_KEYS = {
  MEASUREMENTS: '@qos_monitor:measurements_v1',
  SESSIONS: '@qos_monitor:sessions_v1',
  ALERTS: '@qos_monitor:alerts_v1',
  SETTINGS: '@qos_monitor:settings_v1',
};

export class PersistenceRepository {
  private static memoryCache: {
    measurements: QoSMeasurementRecord[];
    sessions: QoSSession[];
    alerts: QoSDegradationAlert[];
  } | null = null;

  private static async loadCache(): Promise<{
    measurements: QoSMeasurementRecord[];
    sessions: QoSSession[];
    alerts: QoSDegradationAlert[];
  }> {
    if (this.memoryCache) return this.memoryCache;

    try {
      const [mRaw, sRaw, aRaw] = await Promise.all([
        AsyncStorageSafe.getItem(STORAGE_KEYS.MEASUREMENTS),
        AsyncStorageSafe.getItem(STORAGE_KEYS.SESSIONS),
        AsyncStorageSafe.getItem(STORAGE_KEYS.ALERTS),
      ]);

      this.memoryCache = {
        measurements: mRaw ? JSON.parse(mRaw) : [],
        sessions: sRaw ? JSON.parse(sRaw) : [],
        alerts: aRaw ? JSON.parse(aRaw) : [],
      };
    } catch {
      this.memoryCache = { measurements: [], sessions: [], alerts: [] };
    }

    return this.memoryCache;
  }

  static async saveMeasurement(record: QoSMeasurementRecord): Promise<void> {
    const cache = await this.loadCache();
    cache.measurements.unshift(record); // Insert at beginning

    try {
      await AsyncStorageSafe.setItem(
        STORAGE_KEYS.MEASUREMENTS,
        JSON.stringify(cache.measurements.slice(0, 500)) // Keep latest 500 in local storage
      );
    } catch (err) {
      console.warn('[Persistence] Error guardando medición:', err);
    }
  }

  static async getMeasurements(filters?: HistoryFilters): Promise<QoSMeasurementRecord[]> {
    const cache = await this.loadCache();
    let results = [...cache.measurements];

    if (!filters) return results;

    // Filter by date range
    if (filters.startDate != null) {
      results = results.filter((r) => r.timestamp >= (filters.startDate as number));
    }
    if (filters.endDate != null) {
      results = results.filter((r) => r.timestamp <= (filters.endDate as number));
    }

    // Filter by network types (RF-09)
    if (filters.networkTypes && filters.networkTypes.length > 0) {
      results = results.filter((r) =>
        filters.networkTypes?.includes(r.network.type)
      );
    }

    // Filter by minimum QoS score
    if (filters.minQosScore != null) {
      results = results.filter((r) => r.qos.score >= (filters.minQosScore as number));
    }

    // Filter by geographic bounding box (RF-09)
    if (filters.boundingBox) {
      results = results.filter((r) => {
        if (!r.location) return false;
        return isPointInBoundingBox(
          { latitude: r.location.latitude, longitude: r.location.longitude },
          filters.boundingBox!
        );
      });
    }

    return results;
  }

  static async saveSession(session: QoSSession): Promise<void> {
    const cache = await this.loadCache();
    const existingIndex = cache.sessions.findIndex((s) => s.id === session.id);
    if (existingIndex >= 0) {
      cache.sessions[existingIndex] = session;
    } else {
      cache.sessions.unshift(session);
    }

    try {
      await AsyncStorageSafe.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(cache.sessions));
    } catch (err) {
      console.warn('[Persistence] Error guardando sesión:', err);
    }
  }

  static async getSessions(): Promise<QoSSession[]> {
    const cache = await this.loadCache();
    return cache.sessions;
  }

  static async saveAlert(alert: QoSDegradationAlert): Promise<void> {
    const cache = await this.loadCache();
    cache.alerts.unshift(alert);

    try {
      await AsyncStorageSafe.setItem(
        STORAGE_KEYS.ALERTS,
        JSON.stringify(cache.alerts.slice(0, 100))
      );
    } catch (err) {
      console.warn('[Persistence] Error guardando alerta:', err);
    }
  }

  static async getAlerts(): Promise<QoSDegradationAlert[]> {
    const cache = await this.loadCache();
    return cache.alerts;
  }

  static async clearAll(): Promise<void> {
    this.memoryCache = { measurements: [], sessions: [], alerts: [] };
    await AsyncStorageSafe.multiRemove([
      STORAGE_KEYS.MEASUREMENTS,
      STORAGE_KEYS.SESSIONS,
      STORAGE_KEYS.ALERTS,
    ]);
  }
}
