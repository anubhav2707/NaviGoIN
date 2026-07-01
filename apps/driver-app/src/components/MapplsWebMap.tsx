import React, { useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { getMapplsSdkUrl, isMapplsConfigured, DEFAULT_MAP_CONFIG } from '../config/mappls';
import { colors, typography } from '../theme/theme';

interface MapMarker {
  position: { lat: number; lng: number };
  color?: string;
  title?: string;
}

interface MapplsWebMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  onMapReady?: () => void;
  showNavigation?: boolean;
  destination?: { lat: number; lng: number };
}

export default function MapplsWebMap({
  center = DEFAULT_MAP_CONFIG.defaultCenter,
  zoom = DEFAULT_MAP_CONFIG.defaultZoom,
  markers = [],
  onMapReady,
  showNavigation = false,
  destination,
}: MapplsWebMapProps) {
  const webViewRef = useRef<WebView>(null);
  const mapUrl = getMapplsSdkUrl();

  if (!isMapplsConfigured() || !mapUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Map not configured</Text>
          <Text style={styles.placeholderSubtext}>Please add Mappls API key</Text>
        </View>
      </View>
    );
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="${mapUrl}"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { width: 100%; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        let map;
        let navigationControl;
        
        function initMap() {
          map = new mappls.Map('map', {
            center: [${center.lng}, ${center.lat}],
            zoom: ${zoom}
          });
          
          // Add markers
          ${markers.map(marker => `
            new mappls.Marker({
              position: [${marker.position.lng}, ${marker.position.lat}],
              color: '${marker.color || 'red'}',
              fitbounds: false
            }).addTo(map);
          `).join('')}
          
          // Add navigation if needed
          ${showNavigation && destination ? `
            navigationControl = new mappls.NavigationControl({
              start: [${center.lng}, ${center.lat}],
              end: [${destination.lng}, ${destination.lat}],
              profile: 'driving'
            });
            map.addControl(navigationControl);
          ` : ''}
          
          // Notify React Native
          window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'mapReady' }));
        }
        
        // Initialize map when ready
        if (typeof mappls !== 'undefined') {
          initMap();
        } else {
          window.addEventListener('load', initMap);
        }
      </script>
    </body>
    </html>
  `;

  return (
    <WebView
      ref={webViewRef}
      style={styles.container}
      source={{ html: htmlContent }}
      onMessage={(event) => {
        const message = JSON.parse(event.nativeEvent.data);
        if (message.type === 'mapReady' && onMapReady) {
          onMapReady();
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
  },
  placeholderSubtext: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
});