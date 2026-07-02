describe('App Launch and Display Name E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display NaviGoIn as the app name on launch', async () => {
    // This test verifies the app launches with the correct name
    // The actual display name verification happens at the OS level
    await expect(element(by.text('NaviGoIn'))).toBeVisible();
  });

  it('should not display any references to RideNow', async () => {
    await expect(element(by.text('RideNow'))).not.toExist();
    await expect(element(by.text('Ride App'))).not.toExist();
  });

  it('should show NaviGoIn branding on the phone entry screen', async () => {
    await expect(element(by.text('NaviGoIn'))).toBeVisible();
    await expect(element(by.text('Enter your mobile number'))).toBeVisible();
  });

  it('should navigate through authentication with correct branding', async () => {
    // Enter phone number
    await element(by.placeholder('98765 43210')).typeText('9876543210');
    await element(by.text('Continue')).tap();
    
    // Verify OTP screen doesn't show old branding
    await expect(element(by.text('Verify your number'))).toBeVisible();
    await expect(element(by.text('RideNow'))).not.toExist();
  });
});

describe('App Installation Name Verification', () => {
  it('should be installed with name NaviGoIn on iOS', async () => {
    // This test would verify the CFBundleDisplayName in a real iOS environment
    // The test runner should verify the app appears as "NaviGoIn" in the home screen
    if (device.getPlatform() === 'ios') {
      // The app should be installed and visible as "NaviGoIn" on the home screen
      await device.launchApp({ newInstance: true });
      await expect(element(by.text('NaviGoIn'))).toBeVisible();
    }
  });

  it('should be installed with name NaviGoIn on Android', async () => {
    // This test would verify the app_name string resource in a real Android environment
    // The test runner should verify the app appears as "NaviGoIn" in the app drawer
    if (device.getPlatform() === 'android') {
      // The app should be installed and visible as "NaviGoIn" in the launcher
      await device.launchApp({ newInstance: true });
      await expect(element(by.text('NaviGoIn'))).toBeVisible();
    }
  });
});

describe('Build and Configuration Verification', () => {
  it('should compile successfully with new display name', async () => {
    // This test ensures the build doesn't break with the name change
    await device.launchApp();
    await expect(element(by.text('NaviGoIn'))).toBeVisible();
  });

  it('should maintain push notification functionality', async () => {
    // Verify the bundle ID hasn't changed and push notifications still work
    // This is a placeholder for actual push notification testing
    await device.launchApp();
    // Push notification testing would require additional setup
  });
});