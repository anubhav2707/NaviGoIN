import React from 'react';
import { render } from '@testing-library/react-native';
import * as fs from 'fs';
import * as path from 'path';

// Import all screens that might display the app name
import PhoneScreen from '../../screens/auth/PhoneScreen';
import OtpScreen from '../../screens/auth/OtpScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute = {
  params: {
    phone: '+919876543210',
    existingUser: true,
  },
};

jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    requestOtp: jest.fn(),
    verifyOtp: jest.fn(),
    user: null,
    logout: jest.fn(),
  }),
  AuthProvider: ({ children }: any) => children,
}));

describe('Display Name Regression Tests', () => {
  describe('Configuration Files', () => {
    it('app.json should not contain RideNow references', () => {
      const configPath = path.resolve(__dirname, '../../../app.json');
      const configContent = fs.readFileSync(configPath, 'utf-8');
      
      expect(configContent).not.toContain('"RideNow"');
      expect(configContent).not.toContain('"Ride App"');
      expect(configContent).toContain('"NaviGoIn"');
    });

    it('Android strings.xml should not contain RideNow references', () => {
      const stringsPath = path.resolve(__dirname, '../../../android/app/src/main/res/values/strings.xml');
      const stringsContent = fs.readFileSync(stringsPath, 'utf-8');
      
      expect(stringsContent).not.toContain('RideNow');
      expect(stringsContent).not.toContain('Ride App');
      expect(stringsContent).toContain('NaviGoIn');
    });

    it('maintains critical bundle identifiers', () => {
      const configPath = path.resolve(__dirname, '../../../app.json');
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      
      // Bundle IDs should NOT change
      expect(config.expo.ios.bundleIdentifier).toBe('com.ridenow.rider');
      expect(config.expo.android.package).toBe('com.ridenow.rider');
      
      // Display names SHOULD change
      expect(config.expo.name).toBe('NaviGoIn');
      expect(config.expo.ios.infoPlist.CFBundleDisplayName).toBe('NaviGoIn');
      expect(config.expo.ios.infoPlist.CFBundleName).toBe('NaviGoIn');
    });
  });

  describe('UI Component Regression', () => {
    it('PhoneScreen should not display old branding', () => {
      const { queryByText, getByText } = render(
        <PhoneScreen navigation={mockNavigation as any} route={{ params: {} } as any} />
      );
      
      expect(queryByText('RideNow')).toBeNull();
      expect(queryByText('Ride App')).toBeNull();
      expect(getByText('NaviGoIn')).toBeTruthy();
    });

    it('OtpScreen should not display old branding', () => {
      const { queryByText } = render(
        <OtpScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );
      
      expect(queryByText('RideNow')).toBeNull();
      expect(queryByText('Ride App')).toBeNull();
    });
  });

  describe('Build System Regression', () => {
    it('should not break existing build configurations', () => {
      const configPath = path.resolve(__dirname, '../../../app.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      
      // Verify critical build settings remain intact
      expect(config.expo.slug).toBe('rider-app');
      expect(config.expo.version).toBeTruthy();
      expect(config.expo.orientation).toBe('portrait');
      expect(config.expo.icon).toBe('./assets/icon.png');
      expect(config.expo.splash.image).toBe('./assets/splash-icon.png');
    });

    it('should maintain all platform-specific configurations', () => {
      const configPath = path.resolve(__dirname, '../../../app.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      
      // iOS configurations
      expect(config.expo.ios).toBeDefined();
      expect(config.expo.ios.supportsTablet).toBe(true);
      expect(config.expo.ios.bundleIdentifier).toBeDefined();
      
      // Android configurations
      expect(config.expo.android).toBeDefined();
      expect(config.expo.android.package).toBeDefined();
      expect(config.expo.android.adaptiveIcon).toBeDefined();
      
      // Web configurations
      expect(config.expo.web).toBeDefined();
      expect(config.expo.web.favicon).toBeDefined();
    });
  });

  describe('Text Search Regression', () => {
    const sourceFiles = [
      '../../screens/auth/PhoneScreen.tsx',
      '../../screens/auth/OtpScreen.tsx',
    ];

    sourceFiles.forEach((file) => {
      it(`${file} should not contain hardcoded RideNow references`, () => {
        const filePath = path.resolve(__dirname, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          
          // Check for string literals
          expect(content).not.toMatch(/'RideNow'/g);
          expect(content).not.toMatch(/"RideNow"/g);
          expect(content).not.toMatch(/'Ride App'/g);
          expect(content).not.toMatch(/"Ride App"/g);
          
          // Should contain new branding where appropriate
          if (file.includes('PhoneScreen')) {
            expect(content).toContain('NaviGoIn');
          }
        }
      });
    });
  });
});