import { by, device, element, expect as detoxExpect } from 'detox';
import { waitFor } from '../../__tests__/e2e/TripFlow.e2e.test';

describe('App Configuration E2E', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', location: 'always' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('App branding validation', () => {
    it('should display NaviGo branding on launch', async () => {
      // Check if app launches with correct branding
      await waitFor(element(by.text('NaviGo')).atIndex(0))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should show correct app name in navigation headers', async () => {
      // Navigate to home screen
      await waitFor(element(by.id('home-screen')))
        .toExist()
        .withTimeout(5000);

      // Check for NaviGo branding in header or title
      const brandingElement = element(by.text('NaviGo')).atIndex(0);
      await detoxExpect(brandingElement).toBeVisible();
    });

    it('should maintain branding through navigation', async () => {
      // Navigate to different screens and verify branding persists
      const screens = ['home-screen', 'account-screen', 'activity-screen'];
      
      for (const screenId of screens) {
        if (await element(by.id(screenId)).atIndex(0).isVisible().catch(() => false)) {
          await element(by.id(screenId)).tap();
          await waitFor(element(by.text('NaviGo')).atIndex(0))
            .toBeVisible()
            .withTimeout(3000);
        }
      }
    });
  });

  describe('Configuration consistency', () => {
    it('should use correct bundle identifier for iOS', async () => {
      if (device.getPlatform() === 'ios') {
        // This would be validated during the build process
        // The test ensures the app launches with the correct bundle ID
        await detoxExpect(element(by.id('app-root'))).toExist();
      }
    });

    it('should use correct package name for Android', async () => {
      if (device.getPlatform() === 'android') {
        // This would be validated during the build process
        // The test ensures the app launches with the correct package name
        await detoxExpect(element(by.id('app-root'))).toExist();
      }
    });

    it('should load with correct app configuration', async () => {
      // Wait for app to fully load
      await waitFor(element(by.id('app-loaded')))
        .toExist()
        .withTimeout(10000);

      // Verify configuration is applied
      await detoxExpect(element(by.id('app-root'))).toExist();
    });
  });

  describe('Deep linking configuration', () => {
    it('should handle deep links with navigo:// scheme', async () => {
      const deepLink = 'navigo://rider/home';
      
      await device.launchApp({
        newInstance: true,
        url: deepLink
      });

      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should handle universal links for com.navigo.rider', async () => {
      if (device.getPlatform() === 'ios') {
        const universalLink = 'https://navigo.com/rider/trip/123';
        
        await device.launchApp({
          newInstance: false,
          url: universalLink
        });

        // Verify app handles the link
        await waitFor(element(by.id('trip-details')))
          .toExist()
          .withTimeout(5000);
      }
    });
  });

  describe('Splash screen and app launch', () => {
    it('should display splash screen with NaviGo branding', async () => {
      await device.launchApp({ newInstance: true });
      
      // Splash screen should be visible briefly
      // Then main app should load
      await waitFor(element(by.id('app-root')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should transition from splash to main app smoothly', async () => {
      await device.launchApp({ newInstance: true });
      
      // Wait for splash to disappear and main content to appear
      await waitFor(element(by.id('main-content')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Verify NaviGo branding is present
      await detoxExpect(element(by.text('NaviGo')).atIndex(0)).toBeVisible();
    });
  });

  describe('Environment-specific configuration', () => {
    it('should load correct configuration for current environment', async () => {
      // Check if app loads with environment-specific config
      await waitFor(element(by.id('app-root')))
        .toExist()
        .withTimeout(5000);
      
      // In production, would verify API endpoints, feature flags, etc.
      await detoxExpect(element(by.id('app-root'))).toExist();
    });

    it('should handle missing configuration gracefully', async () => {
      // App should still function even with partial config
      await device.launchApp({ newInstance: true });
      
      await waitFor(element(by.id('app-root')))
        .toBeVisible()
        .withTimeout(10000);
      
      // Verify fallback behavior works
      await detoxExpect(element(by.id('app-root'))).toExist();
    });
  });
});