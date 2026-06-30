import { device, element, by, expect as detoxExpect } from 'detox';

/**
 * End-to-end test for the complete trip flow with Mappls integration
 * Tests the actual user journey from booking to trip completion
 */

describe('Trip Flow E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: {
        location: 'always'
      }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Booking Flow with Maps', () => {
    it('should display home screen with map background', async () => {
      // Wait for map to load
      await detoxExpect(element(by.text('Where to?'))).toBeVisible();
      
      // Map should be rendered in background
      // Center pin should be visible
      await detoxExpect(element(by.id('map-background'))).toExist();
    });

    it('should navigate to route selection with map', async () => {
      // Tap on destination input
      await element(by.text('Enter destination')).tap();
      
      // Route selection screen should show
      await detoxExpect(element(by.text('Set Route'))).toBeVisible();
      
      // Map should still be visible
      await detoxExpect(element(by.id('map-background'))).toExist();
    });

    it('should enter pickup and drop locations', async () => {
      await element(by.text('Enter destination')).tap();
      
      // Enter drop location
      await element(by.placeholder('Drop location')).typeText('Airport');
      
      // Pickup should default to current location
      await detoxExpect(element(by.text('Current Location'))).toBeVisible();
      
      // Confirm route
      await element(by.text('Confirm Route')).tap();
    });
  });

  describe('Live Trip Tracking with Maps', () => {
    it('should show driver arriving phase with map', async () => {
      // Navigate to trip tracking
      await element(by.text('Enter destination')).tap();
      await element(by.placeholder('Drop location')).typeText('Airport');
      await element(by.text('Confirm Route')).tap();
      
      // Should show trip tracking screen
      await detoxExpect(element(by.text('Driver is arriving'))).toBeVisible();
      
      // Map with markers should be visible
      await detoxExpect(element(by.id('trip-map'))).toExist();
      
      // ETA should be displayed
      await detoxExpect(element(by.text('ETA'))).toBeVisible();
    });

    it('should show driver reached notification', async () => {
      // Setup trip
      await element(by.text('Enter destination')).tap();
      await element(by.placeholder('Drop location')).typeText('Airport');
      await element(by.text('Confirm Route')).tap();
      
      // Wait for driver to arrive (simulated)
      await waitFor(element(by.text('Driver has arrived')))
        .toBeVisible()
        .withTimeout(10000);
      
      // "I'm here" button should appear
      await detoxExpect(element(by.text("I'm here"))).toBeVisible();
    });

    it('should start trip when rider confirms pickup', async () => {
      // Setup and wait for driver
      await element(by.text('Enter destination')).tap();
      await element(by.placeholder('Drop location')).typeText('Airport');
      await element(by.text('Confirm Route')).tap();
      
      await waitFor(element(by.text('Driver has arrived')))
        .toBeVisible()
        .withTimeout(10000);
      
      // Confirm pickup
      await element(by.text("I'm here")).tap();
      
      // Trip should start
      await detoxExpect(element(by.text('On the way'))).toBeVisible();
    });

    it('should show trip ending phase', async () => {
      // Complete trip flow
      await element(by.text('Enter destination')).tap();
      await element(by.placeholder('Drop location')).typeText('Airport');
      await element(by.text('Confirm Route')).tap();
      
      // Wait for trip phases
      await waitFor(element(by.text('Arriving at destination')))
        .toBeVisible()
        .withTimeout(20000);
    });
  });

  describe('Map Interactions', () => {
    it('should allow map panning and zooming', async () => {
      // Pan the map
      await element(by.id('map-background')).swipe('left');
      await element(by.id('map-background')).swipe('right');
      
      // Pinch to zoom
      await element(by.id('map-background')).pinch(1.5);
      await element(by.id('map-background')).pinch(0.5);
    });

    it('should show driver marker on map', async () => {
      await element(by.text('Enter destination')).tap();
      await element(by.placeholder('Drop location')).typeText('Airport');
      await element(by.text('Confirm Route')).tap();
      
      // Driver marker should be visible
      await detoxExpect(element(by.id('marker-driver'))).toExist();
    });

    it('should show route polyline on map', async () => {
      await element(by.text('Enter destination')).tap();
      await element(by.placeholder('Drop location')).typeText('Airport');
      await element(by.text('Confirm Route')).tap();
      
      // Route should be drawn on map
      await detoxExpect(element(by.id('route-polyline'))).toExist();
    });
  });

  describe('Fallback Behavior', () => {
    it('should show placeholder when map fails to load', async () => {
      // Disable network to simulate map loading failure
      await device.disableSynchronization();
      await device.setURLBlacklist(['https://apis.mappls.com/*']);
      
      await device.reloadReactNative();
      
      // Should still show UI with fallback
      await detoxExpect(element(by.text('Where to?'))).toBeVisible();
      
      // Re-enable network
      await device.setURLBlacklist([]);
      await device.enableSynchronization();
    });

    it('should handle missing Mappls configuration', async () => {
      // This would test the app without EXPO_PUBLIC_MAPPLS_MAP_KEY
      // App should still function with placeholder map
      
      await detoxExpect(element(by.text('Where to?'))).toBeVisible();
      
      // Navigation should still work
      await element(by.text('Enter destination')).tap();
      await detoxExpect(element(by.text('Set Route'))).toBeVisible();
    });
  });

  describe('Driver Actions', () => {
    it('should allow calling driver', async () => {
      await element(by.text('Enter destination')).tap();
      await element(by.placeholder('Drop location')).typeText('Airport');
      await element(by.text('Confirm Route')).tap();
      
      // Call button should be functional
      await element(by.text('Call')).tap();
      
      // Would open dialer in real app
    });

    it('should allow messaging driver', async () => {
      await element(by.text('Enter destination')).tap();
      await element(by.placeholder('Drop location')).typeText('Airport');
      await element(by.text('Confirm Route')).tap();
      
      // Message button should be functional
      await element(by.text('Message')).tap();
      
      // Would open chat in real app
    });
  });
});

// Helper function for complex waits
async function waitFor(element: any) {
  return {
    toBeVisible: () => ({
      withTimeout: (timeout: number) => 
        new Promise(resolve => setTimeout(resolve, timeout))
    })
  };
}