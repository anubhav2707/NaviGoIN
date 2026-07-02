# NaviGoIn Rider App

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
- Pan and zoom capabilities

## Company

**NaviGoIn** - Your trusted ride-sharing partner

## License

© 2024 NaviGoIn. All rights reserved.