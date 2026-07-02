/**
 * Regression tests to ensure existing functionality remains intact
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Configuration Regression Tests', () => {
  let appConfig: any;
  let packageConfig: any;
  
  beforeAll(() => {
    const appJsonPath = path.resolve(__dirname, '../../../app.json');
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    
    appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  });

  describe('Existing functionality preservation', () => {
    it('should maintain all existing Expo configuration fields', () => {
      // Core fields that must be present
      expect(appConfig.expo).toBeDefined();
      expect(appConfig.expo.version).toBeDefined();
      expect(appConfig.expo.orientation).toBe('portrait');
      expect(appConfig.expo.userInterfaceStyle).toBe('light');
      expect(appConfig.expo.newArchEnabled).toBe(true);
    });

    it('should preserve splash screen configuration', () => {
      expect(appConfig.expo.splash).toBeDefined();
      expect(appConfig.expo.splash.resizeMode).toBe('contain');
      expect(appConfig.expo.splash.backgroundColor).toBe('#ffffff');
    });

    it('should maintain extra configuration for Mappls', () => {
      expect(appConfig.expo.extra).toBeDefined();
      expect(appConfig.expo.extra.mapplsMapKey).toBe(null);
    });

    it('should preserve all npm scripts', () => {
      const requiredScripts = [
        'start', 'android', 'ios', 'web',
        'test', 'test:e2e', 'lint', 'typecheck'
      ];
      
      requiredScripts.forEach(script => {
        expect(packageConfig.scripts[script]).toBeDefined();
      });
    });

    it('should maintain all dependencies', () => {
      const criticalDependencies = [
        'expo', 'expo-status-bar', 'react', 'react-native',
        'react-native-webview', 'expo-constants',
        '@react-navigation/native', '@react-navigation/stack',
        'react-native-screens', 'react-native-safe-area-context',
        'react-native-reanimated'
      ];
      
      criticalDependencies.forEach(dep => {
        expect(packageConfig.dependencies[dep]).toBeDefined();
      });
    });
  });

  describe('Build system compatibility', () => {
    it('should not break existing build commands', () => {
      const canRunCommand = (command: string) => {
        try {
          execSync(`npm run ${command} --dry-run`, {
            cwd: path.resolve(__dirname, '../../..'),
            stdio: 'ignore'
          });
          return true;
        } catch {
          return false;
        }
      };
      
      expect(canRunCommand('start')).toBe(true);
      expect(canRunCommand('typecheck')).toBe(true);
      expect(canRunCommand('lint')).toBe(true);
    });

    it('should maintain TypeScript configuration compatibility', () => {
      const tsconfigPath = path.resolve(__dirname, '../../../tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);
      
      // Run TypeScript check
      const typeCheckResult = execSync('npx tsc --noEmit --project tsconfig.json', {
        cwd: path.resolve(__dirname, '../../..'),
        encoding: 'utf8'
      });
      
      expect(typeCheckResult).not.toContain('error');
    });
  });

  describe('Navigation and routing preservation', () => {
    it('should not affect navigation configuration', () => {
      // Verify main entry point is unchanged
      expect(packageConfig.main).toBe('index.ts');
      
      // Check that navigation files exist
      const navigationFiles = [
        'src/navigation/AppNavigator.tsx',
        'src/navigation/AuthNavigator.tsx',
        'src/navigation/RootNavigator.tsx'
      ];
      
      navigationFiles.forEach(file => {
        const filePath = path.resolve(__dirname, '../../..', file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Asset configuration preservation', () => {
    it('should maintain all asset references', () => {
      const assetRefs = [
        appConfig.expo.icon,
        appConfig.expo.splash.image,
        appConfig.expo.android.adaptiveIcon.foregroundImage,
        appConfig.expo.android.adaptiveIcon.backgroundImage,
        appConfig.expo.android.adaptiveIcon.monochromeImage,
        appConfig.expo.web.favicon
      ];
      
      assetRefs.forEach(ref => {
        expect(ref).toMatch(/^\.\//); // Should be relative path
        expect(ref).toContain('assets/'); // Should be in assets folder
      });
    });
  });

  describe('Development workflow preservation', () => {
    it('should not break hot reload configuration', () => {
      // Check for React Native new architecture
      expect(appConfig.expo.newArchEnabled).toBe(true);
    });

    it('should maintain development dependencies', () => {
      const devDeps = [
        '@babel/core', 'typescript', 'jest',
        '@testing-library/react-native', 'detox',
        'eslint', '@typescript-eslint/parser'
      ];
      
      devDeps.forEach(dep => {
        expect(packageConfig.devDependencies[dep]).toBeDefined();
      });
    });
  });

  describe('API client configuration', () => {
    it('should not affect API client functionality', () => {
      // Verify API client file exists
      const apiClientPath = path.resolve(__dirname, '../../../src/api/client.ts');
      expect(fs.existsSync(apiClientPath)).toBe(true);
    });
  });

  describe('Test suite preservation', () => {
    it('should maintain Jest configuration', () => {
      const jestConfigPath = path.resolve(__dirname, '../../../jest.config.js');
      expect(fs.existsSync(jestConfigPath)).toBe(true);
    });

    it('should maintain Detox configuration', () => {
      const detoxConfigPath = path.resolve(__dirname, '../../../.detoxrc.js');
      expect(fs.existsSync(detoxConfigPath)).toBe(true);
    });
  });

  describe('Platform-specific configurations', () => {
    it('should support iOS tablet configuration', () => {
      expect(appConfig.expo.ios.supportsTablet).toBe(true);
    });

    it('should maintain Android adaptive icon', () => {
      const adaptiveIcon = appConfig.expo.android.adaptiveIcon;
      expect(adaptiveIcon).toBeDefined();
      expect(Object.keys(adaptiveIcon)).toContain('foregroundImage');
      expect(Object.keys(adaptiveIcon)).toContain('backgroundImage');
      expect(Object.keys(adaptiveIcon)).toContain('monochromeImage');
    });
  });
});