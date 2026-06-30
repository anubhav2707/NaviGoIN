import Constants from 'expo-constants';

/**
 * Mappls (MapMyIndia) configuration
 */

// Get key from environment variable or app.json config
export const MAPPLS_MAP_KEY = 
  process.env.EXPO_PUBLIC_MAPPLS_MAP_KEY || 
  Constants.expoConfig?.extra?.mapplsMapKey || 
  null;

// Check if Mappls is properly configured
export function isMapplsConfigured(): boolean {
  return MAPPLS_MAP_KEY !== null && MAPPLS_MAP_KEY !== '';
}

// Mappls Web SDK URL
export function getMapplsSdkUrl(): string | null {
  if (!isMapplsConfigured()) return null;
  return `https://apis.mappls.com/advancedmaps/api/${MAPPLS_MAP_KEY}/map_sdk?layer=vector&v=3.0`;
}

// Default map settings
export const DEFAULT_MAP_CONFIG = {
  defaultZoom: 15,
  minZoom: 3,
  maxZoom: 20,
  defaultCenter: {
    lat: 28.6139, // Delhi coordinates as default
    lng: 77.2090
  },
  markerColors: {
    pickup: '#10B981', // Green
    drop: '#EF4444',   // Red
    driver: '#3B82F6', // Blue
    custom: '#8B5CF6'  // Purple
  },
  routeColor: '#3B82F6',
  routeWidth: 4
};

// Map style configuration
export const MAPPLS_MAP_STYLE = {
  containerStyle: {
    width: '100%',
    height: '100%'
  }
};

/**
 * Validate coordinates are within India's bounds
 * Mappls primarily covers India
 */
export function isValidIndianCoordinate(lat: number, lng: number): boolean {
  // Rough bounds for India
  return lat >= 6 && lat <= 37 && lng >= 68 && lng <= 97;
}