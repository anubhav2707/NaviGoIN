/**
 * Integration tests for native configuration verification
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Native Configuration Integration Tests', () => {
  let appConfig: any;
  
  beforeAll(() => {
    const appJsonPath = path.resolve(__dirname, '../../../app.json');
    appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  });

  describe('Expo Doctor validation', () => {
    it('should pass expo doctor checks', () => {
      let doctorOutput: string;
      let doctorExitCode: number = 0;
      
      try {
        // Run expo doctor and capture output
        doctorOutput = execSync('npx expo doctor', {
          cwd: path.resolve(__dirname, '../../..'),
          encoding: 'utf8',
          stdio: 'pipe'
        });
      } catch (error: any) {
        doctorExitCode = error.status || 1;
        doctorOutput = error.stdout || '';
      }
      
      // Check for configuration warnings
      expect(doctorOutput).not.toContain('Warning');
      expect(doctorOutput).not.toContain('Error');
      expect(doctorExitCode).toBe(0);
    });
  });

  describe('iOS configuration integration', () => {
    it('should have valid iOS bundle identifier format', () => {
      const bundleId = appConfig.expo.ios.bundleIdentifier;
      
      // Validate iOS bundle identifier format
      expect(bundleId).toMatch(/^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/);
      expect(bundleId.split('.').length).toBeGreaterThanOrEqual(2);
    });

    it('should have iOS build configuration', () => {
      expect(appConfig.expo.ios.buildNumber).toBeDefined();
      expect(appConfig.expo.ios.supportsTablet).toBeDefined();
    });

    it('should generate valid iOS Info.plist entries', () => {
      const infoPlist = appConfig.expo.ios.infoPlist || {};
      
      // Verify display name is set
      expect(infoPlist.CFBundleDisplayName).toBe('NaviGoIn');
      
      // Display name should not contain special characters
      expect(infoPlist.CFBundleDisplayName).toMatch(/^[a-zA-Z0-9 ]+$/);
    });
  });

  describe('Android configuration integration', () => {
    it('should have valid Android package name format', () => {
      const packageName = appConfig.expo.android.package;
      
      // Validate Android package name format
      expect(packageName).toMatch(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/);
      expect(packageName.split('.').length).toBeGreaterThanOrEqual(2);
    });

    it('should have Android version configuration', () => {
      expect(appConfig.expo.android.versionCode).toBeDefined();
      expect(typeof appConfig.expo.android.versionCode).toBe('number');
      expect(appConfig.expo.android.versionCode).toBeGreaterThan(0);
    });

    it('should have adaptive icon configuration', () => {
      const adaptiveIcon = appConfig.expo.android.adaptiveIcon;
      
      expect(adaptiveIcon).toBeDefined();
      expect(adaptiveIcon.foregroundImage).toBeDefined();
      expect(adaptiveIcon.backgroundImage).toBeDefined();
      expect(adaptiveIcon.monochromeImage).toBeDefined();
    });
  });

  describe('Asset availability', () => {
    it('should have all required asset files', () => {
      const assetPaths = [
        appConfig.expo.icon,
        appConfig.expo.splash.image,
        appConfig.expo.android.adaptiveIcon.foregroundImage,
        appConfig.expo.android.adaptiveIcon.backgroundImage,
        appConfig.expo.android.adaptiveIcon.monochromeImage,
        appConfig.expo.web.favicon
      ];
      
      assetPaths.forEach(assetPath => {
        const fullPath = path.resolve(__dirname, '../../..', assetPath);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });
  });

  describe('Build configuration', () => {
    it('should have prebuild configuration ready', () => {
      // Check if expo can generate native projects
      const canPrebuild = () => {
        try {
          execSync('npx expo prebuild --no-install --platform ios --clear', {
            cwd: path.resolve(__dirname, '../../..'),
            stdio: 'ignore'
          });
          return true;
        } catch {
          return false;
        }
      };
      
      expect(canPrebuild()).toBe(true);
    });
  });

  describe('Configuration compatibility', () => {
    it('should have compatible Expo SDK version', () => {
      const packageJsonPath = path.resolve(__dirname, '../../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const expoVersion = packageJson.dependencies.expo;
      expect(expoVersion).toMatch(/~54\.0\.0/);
    });

    it('should have new architecture enabled', () => {
      expect(appConfig.expo.newArchEnabled).toBe(true);
    });
  });
});