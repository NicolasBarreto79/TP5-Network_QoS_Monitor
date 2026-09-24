import { GeoPoint, BoundingBox, HeatmapPoint, ConnectionType } from './types.js';

/**
 * Calculates distance between two coordinates in meters using the Haversine formula.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Checks if a point is within a geographic bounding box
 */
export function isPointInBoundingBox(
  point: { latitude: number; longitude: number },
  box: BoundingBox
): boolean {
  return (
    point.latitude >= box.minLat &&
    point.latitude <= box.maxLat &&
    point.longitude >= box.minLon &&
    point.longitude <= box.maxLon
  );
}

/**
 * Computes a bounding box enclosing a set of points with optional margin in degrees
 */
export function computeBoundingBox(
  points: { latitude: number; longitude: number }[],
  marginDegrees = 0.005
): BoundingBox | null {
  if (points.length === 0) return null;

  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLon = points[0].longitude;
  let maxLon = points[0].longitude;

  for (const p of points) {
    if (p.latitude < minLat) minLat = p.latitude;
    if (p.latitude > maxLat) maxLat = p.latitude;
    if (p.longitude < minLon) minLon = p.longitude;
    if (p.longitude > maxLon) maxLon = p.longitude;
  }

  return {
    minLat: minLat - marginDegrees,
    maxLat: maxLat + marginDegrees,
    minLon: minLon - marginDegrees,
    maxLon: maxLon + marginDegrees,
  };
}

/**
 * Transforms a raw measurement into a Heatmap weighted point.
 * Normalizes weight between 0.1 (poor signal/critical) and 1.0 (optimal signal/excellent QoS).
 */
export function createHeatmapPoint(params: {
  latitude: number;
  longitude: number;
  qosScore: number;
  networkType: ConnectionType;
  rssiDbm?: number;
  timestamp?: number;
}): HeatmapPoint {
  // Map QoS score 0..100 into 0.1..1.0
  const weight = Number(Math.max(0.1, Math.min(1.0, params.qosScore / 100)).toFixed(2));

  return {
    latitude: params.latitude,
    longitude: params.longitude,
    weight,
    qosScore: params.qosScore,
    networkType: params.networkType,
    rssiDbm: params.rssiDbm,
    timestamp: params.timestamp ?? Date.now(),
  };
}
