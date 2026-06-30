import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getMapplsSdkUrl, DEFAULT_MAP_CONFIG, isMapplsConfigured } from '../config/mappls';
import { LatLng, MapMarker, MapCameraPosition } from '../types/geo';

interface MapplsWebMapProps {
  center?: LatLng;
  zoom?: number;
  markers?: MapMarker[];
  routePath?: LatLng[];
  onReady?: () => void;
  onError?: (error: string) => void;
  onMarkerClick?: (markerId: string) => void;
  showUserLocation?: boolean;
  style?: any;
}

export default function MapplsWebMap({
  center = DEFAULT_MAP_CONFIG.defaultCenter,
  zoom = DEFAULT_MAP_CONFIG.defaultZoom,
  markers = [],
  routePath = [],
  onReady,
  onError,
  onMarkerClick,
  showUserLocation = false,
  style
}: MapplsWebMapProps) {
  const webViewRef = useRef<WebView>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Generate HTML content for the WebView
  const generateMapHtml = useCallback(() => {
    const sdkUrl = getMapplsSdkUrl();
    if (!sdkUrl) {
      return '<html><body><h3>Mappls Map SDK not configured</h3></body></html>';
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    body { margin: 0; padding: 0; overflow: hidden; }
    #map { position: absolute; top: 0; bottom: 0; width: 100%; height: 100%; }
    .marker-icon {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="${sdkUrl}"></script>
  <script>
    let map;
    let markersMap = new Map();
    let routePolyline = null;

    // Initialize map
    function initMap() {
      try {
        map = new mappls.Map('map', {
          center: [${center.lng}, ${center.lat}],
          zoom: ${zoom},
          zoomControl: true,
          scaleControl: false,
          rotateControl: false
        });

        map.on('load', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapReady'
          }));
        });

        map.on('error', function(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            message: e.message || 'Map error'
          }));
        });
      } catch (error) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: error.message || 'Failed to initialize map'
        }));
      }
    }

    // Add or update markers
    function updateMarkers(markersData) {
      // Remove old markers
      markersMap.forEach((marker) => {
        marker.remove();
      });
      markersMap.clear();

      // Add new markers
      markersData.forEach(markerData => {
        const el = document.createElement('div');
        el.className = 'marker-icon';
        el.style.backgroundColor = getMarkerColor(markerData.kind);
        
        const marker = new mappls.Marker({
          element: el,
          offset: [15, 15]
        })
        .setLngLat([markerData.position.lng, markerData.position.lat])
        .addTo(map);

        if (markerData.title) {
          marker.setPopup(
            new mappls.Popup({ offset: 25 })
              .setText(markerData.title)
          );
        }

        el.addEventListener('click', () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'markerClick',
            markerId: markerData.id
          }));
        });

        markersMap.set(markerData.id, marker);
      });
    }

    // Draw route polyline
    function drawRoute(routePoints) {
      // Remove existing route
      if (routePolyline) {
        routePolyline.remove();
        routePolyline = null;
      }

      if (routePoints && routePoints.length > 0) {
        const coordinates = routePoints.map(p => [p.lng, p.lat]);
        
        routePolyline = new mappls.Polyline({
          map: map,
          paths: coordinates,
          strokeColor: '${DEFAULT_MAP_CONFIG.routeColor}',
          strokeOpacity: 0.8,
          strokeWeight: ${DEFAULT_MAP_CONFIG.routeWidth}
        });
      }
    }

    // Update camera position
    function setCamera(center, zoom) {
      if (map) {
        map.setCenter([center.lng, center.lat]);
        map.setZoom(zoom);
      }
    }

    // Get marker color based on kind
    function getMarkerColor(kind) {
      const colors = {
        pickup: '${DEFAULT_MAP_CONFIG.markerColors.pickup}',
        drop: '${DEFAULT_MAP_CONFIG.markerColors.drop}',
        driver: '${DEFAULT_MAP_CONFIG.markerColors.driver}',
        custom: '${DEFAULT_MAP_CONFIG.markerColors.custom}'
      };
      return colors[kind] || colors.custom;
    }

    // Handle messages from React Native
    function handleMessage(event) {
      try {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case 'updateMarkers':
            updateMarkers(message.markers);
            break;
          case 'drawRoute':
            drawRoute(message.routePath);
            break;
          case 'setCamera':
            setCamera(message.center, message.zoom);
            break;
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    }

    // Initialize on load
    window.addEventListener('load', initMap);
    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage);
  </script>
</body>
</html>
    `;
  }, [center, zoom]);

  // Handle messages from WebView
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      switch (message.type) {
        case 'mapReady':
          setIsMapReady(true);
          setIsLoading(false);
          onReady?.();
          break;
        case 'error':
          setIsLoading(false);
          onError?.(message.message);
          break;
        case 'markerClick':
          onMarkerClick?.(message.markerId);
          break;
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  }, [onReady, onError, onMarkerClick]);

  // Update markers when prop changes
  useEffect(() => {
    if (isMapReady && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'updateMarkers',
        markers
      }));
    }
  }, [markers, isMapReady]);

  // Update route when prop changes
  useEffect(() => {
    if (isMapReady && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'drawRoute',
        routePath
      }));
    }
  }, [routePath, isMapReady]);

  // Update camera when props change
  useEffect(() => {
    if (isMapReady && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'setCamera',
        center,
        zoom
      }));
    }
  }, [center, zoom, isMapReady]);

  if (!isMapplsConfigured()) {
    return (
      <View style={[styles.container, styles.fallbackContainer, style]}>
        <Text style={styles.fallbackText}>Map not configured</Text>
        <Text style={styles.fallbackSubtext}>Please add EXPO_PUBLIC_MAPPLS_MAP_KEY to .env</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHtml() }}
        onMessage={handleWebViewMessage}
        onError={(error) => {
          console.error('WebView error:', error);
          onError?.('WebView loading error');
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={Platform.OS === 'android'}
        mixedContentMode="compatibility"
        originWhitelist={['*']}
        allowsInlineMediaPlayback={true}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6'
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  fallbackSubtext: {
    fontSize: 14,
    color: '#6b7280'
  }
});