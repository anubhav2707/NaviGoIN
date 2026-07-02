import Constants from 'expo-constants';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      name: 'NaviGo',
      slug: 'navigo-rider',
      version: '1.0.0',
      ios: {
        bundleIdentifier: 'com.navigo.rider'
      },
      android: {
        package: 'com.navigo.rider'
      },
      extra: {
        mapplsMapKey: null
      }
    }
  }
}));

describe('Configuration Integration', () => {
  describe('Expo Constants integration', () => {
    it('should expose app configuration through Constants', () => {
      expect(Constants.expoConfig?.name).toBe('NaviGo');
      expect(Constants.expoConfig?.slug).toBe('navigo-rider');
    });

    it('should expose platform-specific configuration', () => {
      expect(Constants.expoConfig?.ios?.bundleIdentifier).toBe('com.navigo.rider');
      expect(Constants.expoConfig?.android?.package).toBe('com.navigo.rider');
    });

    it('should expose extra configuration', () => {
      expect(Constants.expoConfig?.extra).toBeDefined();
      expect(Constants.expoConfig?.extra).toHaveProperty('mapplsMapKey');
    });
  });

  describe('Configuration loading', () => {
    it('should load app.json configuration correctly', () => {
      const appJsonPath = path.resolve(__dirname, '../../../app.json');
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      
      expect(appConfig.expo.name).toBe('NaviGo');
      expect(appConfig.expo.slug).toBe('navigo-rider');
    });

    it('should load package.json configuration correctly', () => {
      const packageJsonPath = path.resolve(__dirname, '../../../package.json');
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      expect(packageConfig.name).toBe('navigo-rider');
    });

    it('should handle missing configuration gracefully', () => {
      const mockConstants = {
        expoConfig: undefined
      };
      
      expect(() => {
        const name = mockConstants.expoConfig?.name || 'DefaultApp';
        expect(name).toBe('DefaultApp');
      }).not.toThrow();
    });
  });

  describe('Environment-specific configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should use environment variables when available', () => {
      process.env.EXPO_PUBLIC_APP_NAME = 'NaviGo Dev';
      
      const appName = process.env.EXPO_PUBLIC_APP_NAME || Constants.expoConfig?.name;
      expect(appName).toBe('NaviGo Dev');
    });

    it('should fall back to config when env vars not set', () => {
      delete process.env.EXPO_PUBLIC_APP_NAME;
      
      const appName = process.env.EXPO_PUBLIC_APP_NAME || Constants.expoConfig?.name;
      expect(appName).toBe('NaviGo');
    });
  });

  describe('Build configuration', () => {
    it('should have consistent configuration for iOS builds', () => {
      const config = Constants.expoConfig;
      
      expect(config?.ios?.bundleIdentifier).toBe('com.navigo.rider');
      expect(config?.ios?.supportsTablet).toBe(true);
    });

    it('should have consistent configuration for Android builds', () => {
      const config = Constants.expoConfig;
      
      expect(config?.android?.package).toBe('com.navigo.rider');
      expect(config?.android?.adaptiveIcon).toBeDefined();
    });

    it('should maintain build versioning', () => {
      const appJsonPath = path.resolve(__dirname, '../../../app.json');
      const packageJsonPath = path.resolve(__dirname, '../../../package.json');
      
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      expect(appConfig.expo.version).toBe(packageConfig.version);
      expect(appConfig.expo.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('Runtime configuration access', () => {
    it('should provide configuration to app components', () => {
      const getAppConfig = () => ({
        name: Constants.expoConfig?.name,
        version: Constants.expoConfig?.version,
        bundleId: Constants.expoConfig?.ios?.bundleIdentifier
      });

      const config = getAppConfig();
      
      expect(config.name).toBe('NaviGo');
      expect(config.version).toBe('1.0.0');
      expect(config.bundleId).toBe('com.navigo.rider');
    });

    it('should expose Mappls configuration', () => {
      const mapplsKey = Constants.expoConfig?.extra?.mapplsMapKey || process.env.EXPO_PUBLIC_MAPPLS_MAP_KEY;
      
      expect(mapplsKey).toBeDefined();
    });
  });
});