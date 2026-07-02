import * as fs from 'fs';
import * as path from 'path';

describe('App Configuration', () => {
  const appJsonPath = path.resolve(__dirname, '../../../app.json');
  const packageJsonPath = path.resolve(__dirname, '../../../package.json');

  let appConfig: any;
  let packageConfig: any;

  beforeAll(() => {
    const appJsonContent = fs.readFileSync(appJsonPath, 'utf-8');
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
    
    appConfig = JSON.parse(appJsonContent);
    packageConfig = JSON.parse(packageJsonContent);
  });

  describe('app.json configuration', () => {
    it('should have correct display name', () => {
      expect(appConfig.expo.name).toBe('NaviGo');
    });

    it('should have correct slug', () => {
      expect(appConfig.expo.slug).toBe('navigo-rider');
    });

    it('should have correct iOS bundle identifier', () => {
      expect(appConfig.expo.ios.bundleIdentifier).toBe('com.navigo.rider');
    });

    it('should have correct Android package name', () => {
      expect(appConfig.expo.android.package).toBe('com.navigo.rider');
    });

    it('should maintain version consistency', () => {
      expect(appConfig.expo.version).toBe('1.0.0');
    });

    it('should have all required icon assets configured', () => {
      expect(appConfig.expo.icon).toBe('./assets/icon.png');
      expect(appConfig.expo.splash.image).toBe('./assets/splash-icon.png');
      expect(appConfig.expo.android.adaptiveIcon.foregroundImage).toBe('./assets/android-icon-foreground.png');
      expect(appConfig.expo.android.adaptiveIcon.backgroundImage).toBe('./assets/android-icon-background.png');
      expect(appConfig.expo.android.adaptiveIcon.monochromeImage).toBe('./assets/android-icon-monochrome.png');
    });

    it('should preserve extra configuration', () => {
      expect(appConfig.expo.extra).toBeDefined();
      expect(appConfig.expo.extra).toHaveProperty('mapplsMapKey');
    });

    it('should have orientation set to portrait', () => {
      expect(appConfig.expo.orientation).toBe('portrait');
    });

    it('should have new architecture enabled', () => {
      expect(appConfig.expo.newArchEnabled).toBe(true);
    });
  });

  describe('package.json configuration', () => {
    it('should have correct package name', () => {
      expect(packageConfig.name).toBe('navigo-rider');
    });

    it('should maintain version consistency with app.json', () => {
      expect(packageConfig.version).toBe(appConfig.expo.version);
    });

    it('should have correct main entry point', () => {
      expect(packageConfig.main).toBe('index.ts');
    });

    it('should be marked as private', () => {
      expect(packageConfig.private).toBe(true);
    });

    it('should have all required scripts', () => {
      const requiredScripts = ['start', 'android', 'ios', 'web', 'test', 'test:e2e', 'lint', 'typecheck'];
      requiredScripts.forEach(script => {
        expect(packageConfig.scripts).toHaveProperty(script);
      });
    });

    it('should have all critical dependencies', () => {
      expect(packageConfig.dependencies['expo']).toBeDefined();
      expect(packageConfig.dependencies['react']).toBeDefined();
      expect(packageConfig.dependencies['react-native']).toBeDefined();
    });
  });

  describe('Configuration consistency', () => {
    it('should have matching version between app.json and package.json', () => {
      expect(appConfig.expo.version).toBe(packageConfig.version);
    });

    it('should have consistent naming pattern', () => {
      const appName = appConfig.expo.name.toLowerCase();
      const slug = appConfig.expo.slug;
      const packageName = packageConfig.name;
      
      expect(slug).toContain(appName);
      expect(packageName).toBe(slug);
    });

    it('should follow company bundle identifier pattern', () => {
      const iosBundleId = appConfig.expo.ios.bundleIdentifier;
      const androidPackage = appConfig.expo.android.package;
      
      expect(iosBundleId).toMatch(/^com\.navigo\..+/);
      expect(androidPackage).toBe(iosBundleId);
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in app name if present', () => {
      expect(appConfig.expo.slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('should have valid semantic versioning', () => {
      expect(appConfig.expo.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should not contain deprecated configuration keys', () => {
      expect(appConfig.expo).not.toHaveProperty('sdkVersion');
      expect(appConfig.expo).not.toHaveProperty('androidStatusBar');
    });
  });
});