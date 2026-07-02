import { by, device, element, expect } from 'detox';

describe('NaviGoIn Branding E2E', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', location: 'always' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display NaviGoIn branding on launch', async () => {
    // Check for NaviGoIn brand name on the login screen
    await expect(element(by.text('NaviGoIn'))).toBeVisible();
    await expect(element(by.text('Enter your mobile number'))).toBeVisible();
  });

  it('should show NaviGoIn in terms and conditions', async () => {
    await expect(
      element(by.text('By continuing, you agree to NaviGoIn\'s'))
    ).toBeVisible();
  });

  it('should complete authentication flow with NaviGoIn branding', async () => {
    // Enter phone number
    await element(by.type('TextInput')).typeText('9876543210');
    await element(by.text('Continue')).tap();

    // OTP screen should maintain branding
    await expect(element(by.text('Enter verification code'))).toBeVisible();
    
    // Enter OTP (using test code)
    await element(by.type('TextInput')).typeText('1234');
    await element(by.text('Verify')).tap();

    // Should navigate to home screen
    await expect(element(by.text('Where to?'))).toBeVisible();
  });

  it('should show NaviGoIn in account section after login', async () => {
    // Assume user is logged in (or perform login flow)
    // Navigate to Account tab
    await element(by.text('Account')).tap();

    // Check for NaviGoIn version
    await expect(element(by.text('NaviGoIn v1.0.0'))).toBeVisible();
  });

  it('should share referral with NaviGoIn branding', async () => {
    // Navigate to Account tab
    await element(by.text('Account')).tap();
    
    // Tap on Referrals
    await element(by.text('Referrals')).tap();
    
    // The share sheet should contain NaviGoIn text
    // Note: Actual share sheet testing depends on platform
  });
});