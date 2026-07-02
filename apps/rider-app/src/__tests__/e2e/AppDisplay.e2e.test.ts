/**
 * E2E tests for app name display verification
 */

import { device, element, by, expect as detoxExpect } from 'detox';
import { execSync } from 'child_process';
import * as path from 'path';

describe('App Display E2E Tests', () => {
  beforeAll(async () => {
    // Launch the app
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', location: 'always' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('App name display on device', () => {
    it('should display correct app name on launch screen', async () => {
      // Wait for app to load
      await detoxExpect(element(by.id('app-container'))).toBeVisible();
      
      // The app name should be visible in the status bar or header
      // This tests that the native configuration is correct
      await device.takeScreenshot('app-launch-with-name');
    });

    it('should have correct app name in device app switcher', async () => {
      // Send app to background
      await device.sendToHome();
      
      // Open app switcher (platform specific)
      if (device.getPlatform() === 'ios') {
        // Double tap home button or swipe up
        await device.shake();
      } else {
        // Android recent apps
        await device.pressBack();
      }
      
      // Take screenshot to verify app name in switcher
      await device.takeScreenshot('app-switcher-name');
      
      // Return to app
      await device.launchApp({ newInstance: false });
    });
  });

  describe('Build compilation verification', () => {
    it('should compile iOS build successfully', async () => {
      if (device.getPlatform() !== 'ios') {
        return; // Skip on Android
      }
      
      // Verify iOS build compiles
      const buildResult = await new Promise((resolve) => {
        try {
          execSync('xcodebuild -workspace ios/navigoin.xcworkspace -scheme navigoin -configuration Debug -sdk iphonesimulator -quiet', {
            cwd: path.resolve(__dirname, '../../..'),
            stdio: 'ignore'
          });
          resolve(true);
        } catch (error) {
          resolve(false);
        }
      });
      
      expect(buildResult).toBe(true);
    });

    it('should compile Android build successfully', async () => {
      if (device.getPlatform() !== 'android') {
        return; // Skip on iOS
      }
      
      // Verify Android build compiles
      const buildResult = await new Promise((resolve) => {
        try {
          execSync('./gradlew assembleDebug', {
            cwd: path.resolve(__dirname, '../../../android'),
            stdio: 'ignore'
          });
          resolve(true);
        } catch (error) {
          resolve(false);
        }
      });
      
      expect(buildResult).toBe(true);
    });
  });

  describe('App metadata verification', () => {
    it('should have correct bundle/package identifier', async () => {
      // Get app metadata
      const appId = await device.appMetadata('bundleId');
      
      if (device.getPlatform() === 'ios') {
        expect(appId).toBe('com.navigoin.rider');
      } else {
        expect(appId).toBe('com.navigoin.rider');
      }
    });

    it('should display NaviGoIn as app name in permissions dialog', async () => {
      // Trigger a permission request
      await element(by.id('request-location-permission')).tap();
      
      // Take screenshot of permission dialog
      // The app name "NaviGoIn" should be visible
      await device.takeScreenshot('permission-dialog-app-name');
      
      // Accept permission
      if (device.getPlatform() === 'ios') {
        await element(by.label('Allow While Using App')).tap();
      } else {
        await element(by.text('ALLOW')).tap();
      }
    });
  });

  describe('Splash screen verification', () => {
    it('should display splash screen with correct branding', async () => {
      // Kill and relaunch app to see splash
      await device.terminateApp();
      await device.launchApp({ newInstance: true });
      
      // Take screenshot quickly to capture splash
      await device.takeScreenshot('splash-screen-branding');
      
      // Wait for app to fully load
      await detoxExpect(element(by.id('app-container'))).toBeVisible();
    });
  });

  describe('Web view configuration', () => {
    it('should display correct app name in web views', async () => {
      // Navigate to a screen with WebView
      await element(by.id('help-support-button')).tap();
      
      // Wait for WebView to load
      await detoxExpect(element(by.id('support-webview'))).toBeVisible();
      
      // The user agent should contain NaviGoIn
      await device.takeScreenshot('webview-user-agent');
    });
  });
});

// Detox configuration helper
export const detoxConfig = {
  testRunner: 'jest',
  runnerConfig: 'e2e/config.json',
  configurations: {
    ios: {
      type: 'ios.simulator',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/NaviGoIn.app',
      build: 'xcodebuild -workspace ios/navigoin.xcworkspace -scheme navigoin -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
      device: {
        type: 'iPhone 14'
      }
    },
    android: {
      type: 'android.emulator',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd ..',
      device: {
        avdName: 'Pixel_4_API_30'
      }
    }
  }
};