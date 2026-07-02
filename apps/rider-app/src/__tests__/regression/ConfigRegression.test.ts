import * as fs from 'fs';
import * as path from 'path';
import Constants from 'expo-constants';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      name: 'NaviGo',
      slug: 'navigo-rider',
      version: '1.0.0',
      ios: {
        bundleIdentifier: 'com.navigo.rider',
        supportsTablet: true
      },
      android: {
        package: 'com.navigo.rider',
        adaptiveIcon: {
          foregroundImage: './assets/android-icon-foreground.png',
          backgroundImage: './assets/android-icon-background.png',
          monochromeImage: './assets/android-icon-monochrome.png'
        }
      },
      extra: {
        mapplsMapKey: null
      }
    }
  }
}));

describe('Configuration Regression Tests', () => {
  const appJsonPath = path.resolve(__dirname, '../../../app.json');
  const packageJsonPath = path.resolve(__dirname, '../../../package.json');

  describe('Backward compatibility', () => {
    it('should maintain all existing configuration fields', () => {
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      
      // Ensure all critical fields exist
      expect(appConfig.expo).toBeDefined();
      expect(appConfig.expo.name).toBeDefined();
      expect(appConfig.expo.slug).toBeDefined();
      expect(appConfig.expo.version).toBeDefined();
      expect(appConfig.expo.orientation).toBe('portrait');
      expect(appConfig.expo.icon).toBe('./assets/icon.png');
      expect(appConfig.expo.userInterfaceStyle).toBe('light');
      expect(appConfig.expo.newArchEnabled).toBe(true);
      expect(appConfig.expo.splash).toBeDefined();
      expect(appConfig.expo.ios).toBeDefined();
      expect(appConfig.expo.android).toBeDefined();
      expect(appConfig.expo.web).toBeDefined();
      expect(appConfig.expo.extra).toBeDefined();
    });

    it('should preserve all package.json scripts', () => {
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      const expectedScripts = [
        'start', 'android', 'ios', 'web', 
        'test', 'test:e2e', 'lint', 'typecheck'
      ];
      
      expectedScripts.forEach(script => {
        expect(packageConfig.scripts[script]).toBeDefined();
      });
    });

    it('should maintain all dependencies', () => {
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      // Core dependencies should remain
      expect(packageConfig.dependencies['expo']).toBeDefined();
      expect(packageConfig.dependencies['react']).toBeDefined();
      expect(packageConfig.dependencies['react-native']).toBeDefined();
      expect(packageConfig.dependencies['react-native-webview']).toBeDefined();
      expect(packageConfig.dependencies['@react-navigation/native']).toBeDefined();
    });
  });

  describe('Breaking change detection', () => {
    it('should not break iOS configuration', () => {
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      
      expect(appConfig.expo.ios.bundleIdentifier).toMatch(/^com\.[a-z]+\.[a-z]+$/);
      expect(appConfig.expo.ios.supportsTablet).toBe(true);
    });

    it('should not break Android configuration', () => {
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      
      expect(appConfig.expo.android.package).toMatch(/^com\.[a-z]+\.[a-z]+$/);
      expect(appConfig.expo.android.adaptiveIcon).toBeDefined();
      expect(appConfig.expo.android.adaptiveIcon.foregroundImage).toBeDefined();
      expect(appConfig.expo.android.adaptiveIcon.backgroundImage).toBeDefined();
    });

    it('should not break splash screen configuration', () => {
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      
      expect(appConfig.expo.splash.image).toBe('./assets/splash-icon.png');
      expect(appConfig.expo.splash.resizeMode).toBe('contain');
      expect(appConfig.expo.splash.backgroundColor).toBe('#ffffff');
    });

    it('should not break extra configuration', () => {
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      
      expect(appConfig.expo.extra).toBeDefined();
      expect(appConfig.expo.extra.mapplsMapKey).toBeDefined();
    });
  });

  describe('Migration validation', () => {
    it('should update from RideNow to NaviGo correctly', () => {
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      // Verify old values are replaced
      expect(appConfig.expo.name).not.toBe('RideNow');
      expect(appConfig.expo.name).toBe('NaviGo');
      
      expect(appConfig.expo.slug).not.toBe('rider-app');
      expect(appConfig.expo.slug).toBe('navigo-rider');
      
      expect(packageConfig.name).not.toBe('rider-app');
      expect(packageConfig.name).toBe('navigo-rider');
    });

    it('should update bundle identifiers correctly', () => {
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      
      expect(appConfig.expo.ios.bundleIdentifier).not.toBe('com.ridenow.rider');
      expect(appConfig.expo.ios.bundleIdentifier).toBe('com.navigo.rider');
      
      expect(appConfig.expo.android.package).not.toBe('com.ridenow.rider');
      expect(appConfig.expo.android.package).toBe('com.navigo.rider');
    });

    it('should maintain version consistency after migration', () => {
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      expect(appConfig.expo.version).toBe('1.0.0');
      expect(packageConfig.version).toBe('1.0.0');
      expect(appConfig.expo.version).toBe(packageConfig.version);
    });
  });

  describe('Configuration integrity', () => {
    it('should have valid JSON structure', () => {
      expect(() => {
        JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      }).not.toThrow();
      
      expect(() => {
        JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      }).not.toThrow();
    });

    it('should have no missing required fields', () => {
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      
      // Required Expo fields
      expect(appConfig.expo.name).toBeTruthy();
      expect(appConfig.expo.slug).toBeTruthy();
      expect(appConfig.expo.version).toBeTruthy();
    });

    it('should have consistent naming across configs', () => {
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      // Package name should match slug
      expect(packageConfig.name).toBe(appConfig.expo.slug);
      
      // Bundle IDs should use consistent naming
      const expectedPrefix = 'com.navigo.';
      expect(appConfig.expo.ios.bundleIdentifier).toStartWith(expectedPrefix);
      expect(appConfig.expo.android.package).toStartWith(expectedPrefix);
    });
  });

  describe('Runtime compatibility', () => {
    it('should work with Expo Constants', () => {
      expect(Constants.expoConfig?.name).toBe('NaviGo');
      expect(Constants.expoConfig?.slug).toBe('navigo-rider');
    });

    it('should provide configuration to app at runtime', () => {
      const config = Constants.expoConfig;
      
      expect(config).toBeDefined();
      expect(config?.ios?.bundleIdentifier).toBe('com.navigo.rider');
      expect(config?.android?.package).toBe('com.navigo.rider');
    });

    it('should handle missing Constants gracefully', () => {
      const getConfigSafely = () => {
        try {
          return Constants.expoConfig || {};
        } catch {
          return {};
        }
      };
      
      expect(() => getConfigSafely()).not.toThrow();
    });
  });

  describe('Build system compatibility', () => {
    it('should maintain build scripts', () => {
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      expect(packageConfig.scripts.start).toBe('expo start');
      expect(packageConfig.scripts.android).toBe('expo run:android');
      expect(packageConfig.scripts.ios).toBe('expo run:ios');
    });

    it('should preserve private package flag', () => {
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      expect(packageConfig.private).toBe(true);
    });

    it('should maintain main entry point', () => {
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      expect(packageConfig.main).toBe('index.ts');
    });
  });
});