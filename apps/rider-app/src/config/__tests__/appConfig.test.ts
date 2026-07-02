import * as fs from 'fs';
import * as path from 'path';

describe('App Configuration', () => {
  describe('app.json', () => {
    let appConfig: any;

    beforeAll(() => {
      const configPath = path.resolve(__dirname, '../../../app.json');
      const configContent = fs.readFileSync(configPath, 'utf-8');
      appConfig = JSON.parse(configContent);
    });

    it('has the correct display name for Expo', () => {
      expect(appConfig.expo.name).toBe('NaviGoIn');
    });

    it('has the correct iOS display names', () => {
      expect(appConfig.expo.ios.infoPlist.CFBundleDisplayName).toBe('NaviGoIn');
      expect(appConfig.expo.ios.infoPlist.CFBundleName).toBe('NaviGoIn');
    });

    it('maintains the original bundle identifier', () => {
      expect(appConfig.expo.ios.bundleIdentifier).toBe('com.ridenow.rider');
    });

    it('maintains the original Android package name', () => {
      expect(appConfig.expo.android.package).toBe('com.ridenow.rider');
    });

    it('does not change critical configuration values', () => {
      expect(appConfig.expo.slug).toBe('rider-app');
      expect(appConfig.expo.version).toBe('1.0.0');
      expect(appConfig.expo.orientation).toBe('portrait');
    });
  });

  describe('Android strings.xml', () => {
    it('has the correct app_name string resource', () => {
      const stringsPath = path.resolve(__dirname, '../../../android/app/src/main/res/values/strings.xml');
      const stringsContent = fs.readFileSync(stringsPath, 'utf-8');
      
      expect(stringsContent).toContain('<string name="app_name">NaviGoIn</string>');
      expect(stringsContent).not.toContain('RideNow');
      expect(stringsContent).not.toContain('Ride App');
    });
  });
});