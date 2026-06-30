/**
 * Geographic coordinate types and utilities
 */

export type LatLng = {
  lat: number;
  lng: number;
};

export type MapMarker = {
  id: string;
  position: LatLng;
  kind: 'pickup' | 'drop' | 'driver' | 'custom';
  title?: string;
  description?: string;
};

export type MapBounds = {
  northeast: LatLng;
  southwest: LatLng;
};

export type MapCameraPosition = {
  center: LatLng;
  zoom: number;
  bearing?: number;
  tilt?: number;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371000; // Earth's radius in meters
  const lat1Rad = point1.lat * Math.PI / 180;
  const lat2Rad = point2.lat * Math.PI / 180;
  const deltaLat = (point2.lat - point1.lat) * Math.PI / 180;
  const deltaLng = (point2.lng - point1.lng) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Interpolate between two coordinates
 * @param progress - Progress from 0 to 1
 */
export function interpolateLatLng(start: LatLng, end: LatLng, progress: number): LatLng {
  return {
    lat: start.lat + (end.lat - start.lat) * progress,
    lng: start.lng + (end.lng - start.lng) * progress
  };
}

/**
 * Create bounds that encompass all given points
 */
export function createBoundsFromPoints(points: LatLng[]): MapBounds | null {
  if (points.length === 0) return null;

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  for (const point of points) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
  }

  return {
    southwest: { lat: minLat, lng: minLng },
    northeast: { lat: maxLat, lng: maxLng }
  };
}