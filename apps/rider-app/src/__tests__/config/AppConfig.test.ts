import * as fs from 'fs';
import * as path from 'path';

describe('App Configuration Tests', () => {
  let appConfig: any;
  let packageConfig: any;

  beforeAll(() => {
    const appJsonPath = path.resolve(__dirname, '../../../app.json');
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    
    appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  });

  describe('app.json configuration', () => {
    test('should have correct app name', () => {
      expect(appConfig.expo.name).toBe('NaviGoIn');
    });

    test('should have correct slug', () => {
      expect(appConfig.expo.slug).toBe('navigoin');
    });

    test('should have deep linking scheme configured', () => {
      expect(appConfig.expo.scheme).toBe('navigoin');
    });

    test('should have correct iOS bundle identifier', () => {
      expect(appConfig.expo.ios.bundleIdentifier).toBe('com.navigoin.rider');
    });

    test('should have correct iOS display name', () => {
      expect(appConfig.expo.ios.infoPlist?.CFBundleDisplayName).toBe('NaviGoIn');
    });

    test('should have correct Android package name', () => {
      expect(appConfig.expo.android.package).toBe('com.navigoin.rider');
    });

    test('should have correct web configuration', () => {
      expect(appConfig.expo.web.name).toBe('NaviGoIn');
      expect(appConfig.expo.web.shortName).toBe('NaviGoIn');
    });

    test('should have all required icon assets', () => {
      expect(appConfig.expo.icon).toBe('./assets/icon.png');
      expect(appConfig.expo.splash.image).toBe('./assets/splash-icon.png');
      expect(appConfig.expo.android.adaptiveIcon.foregroundImage).toBe('./assets/android-icon-foreground.png');
      expect(appConfig.expo.android.adaptiveIcon.backgroundImage).toBe('./assets/android-icon-background.png');
      expect(appConfig.expo.android.adaptiveIcon.monochromeImage).toBe('./assets/android-icon-monochrome.png');
      expect(appConfig.expo.web.favicon).toBe('./assets/favicon.png');
    });

    test('should have version defined', () => {
      expect(appConfig.expo.version).toBe('1.0.0');
    });

    test('should have portrait orientation', () => {
      expect(appConfig.expo.orientation).toBe('portrait');
    });

    test('should have new architecture enabled', () => {
      expect(appConfig.expo.newArchEnabled).toBe(true);
    });
  });

  describe('package.json configuration', () => {
    test('should have correct package name', () => {
      expect(packageConfig.name).toBe('navigoin');
    });

    test('should have matching version with app.json', () => {
      expect(packageConfig.version).toBe(appConfig.expo.version);
    });

    test('should have doctor script for validation', () => {
      expect(packageConfig.scripts.doctor).toBe('expo doctor');
    });

    test('should have expo-linking dependency for deep linking', () => {
      expect(packageConfig.dependencies['expo-linking']).toBeDefined();
    });

    test('should have all required scripts', () => {
      expect(packageConfig.scripts.start).toBeDefined();
      expect(packageConfig.scripts.android).toBeDefined();
      expect(packageConfig.scripts.ios).toBeDefined();
      expect(packageConfig.scripts.web).toBeDefined();
      expect(packageConfig.scripts.test).toBeDefined();
      expect(packageConfig.scripts['test:e2e']).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing optional fields gracefully', () => {
      expect(appConfig.expo.extra?.mapplsMapKey).toBeNull();
    });

    test('should maintain backward compatibility', () => {
      expect(appConfig.expo.userInterfaceStyle).toBe('light');
      expect(appConfig.expo.splash.resizeMode).toBe('contain');
      expect(appConfig.expo.splash.backgroundColor).toBe('#ffffff');
    });

    test('should have valid JSON structure', () => {
      expect(() => JSON.stringify(appConfig)).not.toThrow();
      expect(() => JSON.stringify(packageConfig)).not.toThrow();
    });
  });
});