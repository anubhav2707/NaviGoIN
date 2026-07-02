/**
 * Unit tests for app configuration validation
 */

import * as fs from 'fs';
import * as path from 'path';

describe('App Configuration Unit Tests', () => {
  let appConfig: any;
  let packageConfig: any;

  beforeAll(() => {
    // Read configuration files
    const appJsonPath = path.resolve(__dirname, '../../../app.json');
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    
    appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  });

  describe('app.json configuration', () => {
    it('should have correct app name', () => {
      expect(appConfig.expo.name).toBe('NaviGoIn');
    });

    it('should have correct slug', () => {
      expect(appConfig.expo.slug).toBe('navigoin');
      expect(appConfig.expo.slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('should have valid version format', () => {
      expect(appConfig.expo.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have required iOS configuration', () => {
      expect(appConfig.expo.ios).toBeDefined();
      expect(appConfig.expo.ios.bundleIdentifier).toBe('com.navigoin.rider');
      expect(appConfig.expo.ios.infoPlist).toBeDefined();
      expect(appConfig.expo.ios.infoPlist.CFBundleDisplayName).toBe('NaviGoIn');
    });

    it('should have required Android configuration', () => {
      expect(appConfig.expo.android).toBeDefined();
      expect(appConfig.expo.android.package).toBe('com.navigoin.rider');
      expect(appConfig.expo.android.versionCode).toBeDefined();
      expect(typeof appConfig.expo.android.versionCode).toBe('number');
    });

    it('should have web configuration with correct name', () => {
      expect(appConfig.expo.web).toBeDefined();
      expect(appConfig.expo.web.name).toBe('NaviGoIn');
      expect(appConfig.expo.web.shortName).toBe('NaviGoIn');
    });

    it('should have all required asset paths', () => {
      expect(appConfig.expo.icon).toBe('./assets/icon.png');
      expect(appConfig.expo.splash.image).toBe('./assets/splash-icon.png');
      expect(appConfig.expo.android.adaptiveIcon.foregroundImage).toBe('./assets/android-icon-foreground.png');
      expect(appConfig.expo.android.adaptiveIcon.backgroundImage).toBe('./assets/android-icon-background.png');
    });

    it('should have experiments configured for TypeScript paths', () => {
      expect(appConfig.expo.experiments).toBeDefined();
      expect(appConfig.expo.experiments.tsconfigPaths).toBe(true);
    });
  });

  describe('package.json configuration', () => {
    it('should have correct package name', () => {
      expect(packageConfig.name).toBe('navigoin-rider');
      expect(packageConfig.name).toMatch(/^[a-z0-9-]+$/);
    });

    it('should have matching version with app.json', () => {
      expect(packageConfig.version).toBe(appConfig.expo.version);
    });

    it('should have required build scripts', () => {
      expect(packageConfig.scripts.doctor).toBe('expo doctor');
      expect(packageConfig.scripts.prebuild).toBe('expo prebuild');
      expect(packageConfig.scripts['build:ios']).toBeDefined();
      expect(packageConfig.scripts['build:android']).toBeDefined();
    });

    it('should have all required dependencies', () => {
      expect(packageConfig.dependencies['expo']).toBeDefined();
      expect(packageConfig.dependencies['react']).toBeDefined();
      expect(packageConfig.dependencies['react-native']).toBeDefined();
    });
  });

  describe('Configuration consistency', () => {
    it('should have consistent naming across configurations', () => {
      const appName = appConfig.expo.name;
      expect(appConfig.expo.ios.infoPlist.CFBundleDisplayName).toBe(appName);
      expect(appConfig.expo.web.name).toBe(appName);
      expect(appConfig.expo.web.shortName).toBe(appName);
    });

    it('should have valid bundle/package identifiers', () => {
      const iosBundleId = appConfig.expo.ios.bundleIdentifier;
      const androidPackage = appConfig.expo.android.package;
      
      expect(iosBundleId).toMatch(/^com\.navigoin\./);
      expect(androidPackage).toMatch(/^com\.navigoin\./);
      expect(iosBundleId).toBe(androidPackage);
    });
  });
});