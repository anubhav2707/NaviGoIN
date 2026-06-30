# RideNow Rider App

Expo-based rider application with integrated Mappls (MapMyIndia) maps via WebView.

## Features

- ✅ Live map display using Mappls Web SDK in WebView (no native modules required)
- ✅ Real-time trip tracking with driver location
- ✅ Route visualization with polylines
- ✅ Pickup and drop location markers
- ✅ Graceful fallback when maps are not configured
- ✅ Works in Expo Go without ejecting

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your device
- Mappls account and API keys

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure Mappls:

   a. Get your Map SDK key from [Mappls Console](https://apps.mappls.com)
   
   b. Add to `.env` file:
   ```
   EXPO_PUBLIC_MAPPLS_MAP_KEY=your_map_sdk_key_here
   ```
   
   OR add to `app.json`:
   ```json
   {
     "expo": {
       "extra": {
         "mapplsMapKey": "your_map_sdk_key_here"
       }
     }
   }
   ```

3. Start the development server:
```bash
npm start
```

4. Open in Expo Go by scanning the QR code

## Architecture

### Map Integration

The app uses Mappls Web Map SDK loaded in a WebView component:

- **MapplsWebMap**: Core WebView wrapper that loads Mappls JS SDK
- **MapBackground**: Map with gradient overlay for home screen
- **TripMap**: Trip tracking map with animated markers

### Key Components

```
src/
├── components/
│   ├── MapplsWebMap.tsx    # WebView map wrapper
│   ├── MapBackground.tsx    # Map with overlays
│   └── TripMap.tsx         # Trip tracking map
├── config/
│   └── mappls.ts           # Mappls configuration
├── types/
│   └── geo.ts              # Geographic types
└── hooks/
    └── useDriverTracking.ts # Driver location tracking
```

### Communication Bridge

React Native ↔ WebView communication:
- **RN → WebView**: `postMessage()` for commands
- **WebView → RN**: `window.ReactNativeWebView.postMessage()` for events

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm test -- --testPathPattern=integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Type Checking
```bash
npm run typecheck
```

## Development

### Without Mappls Key

The app works without configuration, showing placeholder maps:
- Grid pattern background
- Animated progress indicators
- All UI remains functional

### With Mappls Key

When configured, the app shows:
- Real Mappls vector map tiles
- Live markers for pickup/drop/driver
- Actual route polylines
- Pan and zoom functionality

## Performance Notes

- WebView maps have lower performance than native SDKs
- Acceptable for MVP/v1 implementation
- Native SDK migration planned as follow-up

## Troubleshooting

### Map not showing
1. Check if `EXPO_PUBLIC_MAPPLS_MAP_KEY` is set
2. Verify key is valid at apps.mappls.com
3. Check network connectivity
4. Look for errors in console

### WebView errors
1. Ensure `react-native-webview` is installed
2. Clear Expo cache: `expo start -c`
3. Reinstall node_modules

### Build issues
1. This app works in Expo Go - no prebuild needed
2. For production builds, follow Expo's build guide

## API Documentation

### MapplsWebMap Props

```typescript
interface MapplsWebMapProps {
  center?: LatLng;           // Map center position
  zoom?: number;             // Zoom level (3-20)
  markers?: MapMarker[];     // Array of markers
  routePath?: LatLng[];      // Route coordinates
  onReady?: () => void;      // Map loaded callback
  onError?: (e) => void;     // Error callback
  onMarkerClick?: (id) => void; // Marker click handler
}
```

### TripMap Props

```typescript
interface TripMapProps {
  phase: TripPhase;          // Current trip phase
  progress: number;          // Progress (0-1)
  pickupLocation?: LatLng;   // Pickup coordinates
  dropLocation?: LatLng;     // Drop coordinates
  driverLocation?: LatLng;   // Driver coordinates
  routePath?: LatLng[];      // Route path
}
```

## License

Proprietary - RideNow Inc.