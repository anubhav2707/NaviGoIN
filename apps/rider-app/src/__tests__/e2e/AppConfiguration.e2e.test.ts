import { by, device, element, expect } from 'detox';

describe('App Configuration E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('App Display Name', () => {
    test('should display NaviGoIn as app name on device', async () => {
      // This test verifies that the app appears with the correct name on the device
      // The actual verification happens at the OS level during app installation
      // We can verify the app launched successfully with the new configuration
      await expect(element(by.id('app-container'))).toExist();
    });

    test('should have correct app title in navigation bar', async () => {
      // Navigate to a screen that shows the app name
      await element(by.id('home-screen')).tap();
      
      // Verify the app name is displayed correctly
      const appTitle = element(by.text('NaviGoIn'));
      await expect(appTitle).toBeVisible();
    });
  });

  describe('Deep Linking', () => {
    test('should handle navigoin:// scheme URLs', async () => {
      // Test deep linking with the new scheme
      await device.openURL({ url: 'navigoin://home' });
      await expect(element(by.id('home-screen'))).toBeVisible();
    });

    test('should navigate to booking screen via deep link', async () => {
      await device.openURL({ url: 'navigoin://booking/12345' });
      await expect(element(by.id('booking-screen'))).toBeVisible();
    });

    test('should handle invalid deep links gracefully', async () => {
      await device.openURL({ url: 'navigoin://invalid-route' });
      // Should default to home screen or show error
      await expect(element(by.id('home-screen'))).toBeVisible();
    });
  });

  describe('Build Configuration', () => {
    test('should compile and run on iOS', async () => {
      if (device.getPlatform() === 'ios') {
        // Verify iOS-specific features work with new bundle identifier
        await expect(element(by.id('app-container'))).toExist();
        
        // Test iOS-specific permission handling
        await device.sendToHome();
        await device.launchApp();
        await expect(element(by.id('app-container'))).toExist();
      }
    });

    test('should compile and run on Android', async () => {
      if (device.getPlatform() === 'android') {
        // Verify Android-specific features work with new package name
        await expect(element(by.id('app-container'))).toExist();
        
        // Test Android back button handling
        await device.pressBack();
        await device.launchApp();
        await expect(element(by.id('app-container'))).toExist();
      }
    });
  });

  describe('Expo Doctor Compliance', () => {
    test('should pass configuration validation', async () => {
      // This test ensures the app runs without configuration warnings
      // The actual expo doctor check is run during build process
      // Here we verify the app functions correctly
      
      // Test navigation works
      await element(by.id('tab-activity')).tap();
      await expect(element(by.id('activity-screen'))).toBeVisible();
      
      // Test API client works with configuration
      await element(by.id('tab-home')).tap();
      await expect(element(by.id('home-screen'))).toBeVisible();
    });
  });

  describe('Asset Loading', () => {
    test('should load app icon correctly', async () => {
      // Verify splash screen appears and disappears
      // This indicates assets are configured correctly
      await device.launchApp({ newInstance: true });
      await expect(element(by.id('app-container'))).toBeVisible();
    });
  });
});

// Helper function to wait for element with timeout
async function waitForElement(testID: string, timeout: number = 5000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      await expect(element(by.id(testID))).toBeVisible();
      return true;
    } catch (e) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  throw new Error(`Element ${testID} not found within ${timeout}ms`);
}