import * as Location from 'expo-location';
import { GeoPoint } from '@qos-monitor/contracts';

export class LocationService {
  private static defaultLocation: GeoPoint = {
    // Default: Concepción del Uruguay (Sede FCyT UADER)
    latitude: -32.4825,
    longitude: -58.2325,
    altitude: 28,
    accuracy: 5.0,
    speed: 0,
    timestamp: Date.now(),
  };

  /**
   * Solicita permisos de ubicación
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Obtiene la posición actual de alta precisión del dispositivo
   */
  static async getCurrentLocation(): Promise<GeoPoint> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return { ...this.defaultLocation, timestamp: Date.now() };
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude,
        accuracy: position.coords.accuracy ?? 10,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      };
    } catch {
      return { ...this.defaultLocation, timestamp: Date.now() };
    }
  }
}
