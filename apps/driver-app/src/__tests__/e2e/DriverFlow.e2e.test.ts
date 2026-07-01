import { device, element, by, expect as detoxExpect } from 'detox';

describe('Driver Flow E2E', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete driver onboarding flow', async () => {
    // Phone number entry
    await detoxExpect(element(by.text('Enter your mobile number'))).toBeVisible();
    await element(by.placeholder('98765 43210')).typeText('9876543210');
    await element(by.text('Continue')).tap();

    // OTP verification
    await detoxExpect(element(by.text('Verify your number'))).toBeVisible();
    await element(by.placeholder('Enter your name')).typeText('Test Driver');
    
    // Enter dev code (123456)
    await element(by.id('otp-input')).typeText('123456');
    await element(by.text('Verify')).tap();

    // Should reach home screen
    await detoxExpect(element(by.text('You are Offline'))).toBeVisible();
  });

  it('should toggle online/offline status', async () => {
    // Assume already logged in
    await detoxExpect(element(by.text('You are Offline'))).toBeVisible();
    
    // Toggle online
    await element(by.id('online-switch')).tap();
    await detoxExpect(element(by.text('You are Online'))).toBeVisible();
    await detoxExpect(element(by.text('Waiting for trip requests...'))).toBeVisible();
    
    // Toggle offline
    await element(by.id('online-switch')).tap();
    await detoxExpect(element(by.text('You are Offline'))).toBeVisible();
  });

  it('should navigate through main tabs', async () => {
    // Navigate to Earnings
    await element(by.text('Earnings')).tap();
    await detoxExpect(element(by.text('Total Earnings'))).toBeVisible();
    await detoxExpect(element(by.text('₹2450'))).toBeVisible();
    
    // Check period selector
    await element(by.text('Week')).tap();
    await detoxExpect(element(by.text('₹15680'))).toBeVisible();
    
    // Navigate to Profile
    await element(by.text('Profile')).tap();
    await detoxExpect(element(by.text('Test Driver'))).toBeVisible();
    await detoxExpect(element(by.text('+919876543210'))).toBeVisible();
    
    // Check profile menu items
    await detoxExpect(element(by.text('Edit Profile'))).toBeVisible();
    await detoxExpect(element(by.text('Documents'))).toBeVisible();
    await detoxExpect(element(by.text('Vehicle Details'))).toBeVisible();
  });

  it('should handle sign out', async () => {
    // Navigate to Profile
    await element(by.text('Profile')).tap();
    
    // Scroll to sign out button
    await element(by.id('profile-scroll')).scrollTo('bottom');
    
    // Sign out
    await element(by.text('Sign Out')).tap();
    
    // Should return to login screen
    await detoxExpect(element(by.text('Enter your mobile number'))).toBeVisible();
  });

  it('should display earnings breakdown', async () => {
    await element(by.text('Earnings')).tap();
    
    // Check breakdown
    await detoxExpect(element(by.text('Earnings Breakdown'))).toBeVisible();
    await detoxExpect(element(by.text('Trip Earnings'))).toBeVisible();
    await detoxExpect(element(by.text('Tips'))).toBeVisible();
    await detoxExpect(element(by.text('Incentives'))).toBeVisible();
    
    // Check withdraw button
    await detoxExpect(element(by.text('Withdraw Earnings'))).toBeVisible();
  });
});

function waitFor(element: any, timeout: number = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkElement = async () => {
      try {
        await detoxExpect(element).toBeVisible();
        resolve();
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Element not found within ${timeout}ms`));
        } else {
          setTimeout(checkElement, 100);
        }
      }
    };
    
    checkElement();
  });
}