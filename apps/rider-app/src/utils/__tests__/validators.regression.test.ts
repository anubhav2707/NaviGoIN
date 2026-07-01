import { isValidEmail, isValidPhoneNumber, isValidIndianPincode } from '../validators';

/**
 * Regression tests to ensure new isValidIndianPincode function
 * doesn't break existing validator functionality
 */
describe('Validators Regression Tests', () => {
  describe('Existing validators should continue to work', () => {
    describe('isValidEmail - should not be affected', () => {
      it('should still validate emails correctly', () => {
        // Valid emails
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
        expect(isValidEmail('admin+tag@company.org')).toBe(true);
        
        // Invalid emails
        expect(isValidEmail('')).toBe(false);
        expect(isValidEmail('invalid')).toBe(false);
        expect(isValidEmail('@example.com')).toBe(false);
        expect(isValidEmail('user@')).toBe(false);
        expect(isValidEmail('user @example.com')).toBe(false);
      });

      it('should handle edge cases', () => {
        expect(isValidEmail('a@b.c')).toBe(true);
        expect(isValidEmail('test@sub.domain.com')).toBe(true);
        expect(isValidEmail('123@456.789')).toBe(true);
      });
    });

    describe('isValidPhoneNumber - should not be affected', () => {
      it('should still validate phone numbers correctly', () => {
        // Valid phone numbers
        expect(isValidPhoneNumber('1234567890')).toBe(true);
        expect(isValidPhoneNumber('+91 9876543210')).toBe(true);
        expect(isValidPhoneNumber('(123) 456-7890')).toBe(true);
        expect(isValidPhoneNumber('+1-555-123-4567')).toBe(true);
        
        // Invalid phone numbers
        expect(isValidPhoneNumber('')).toBe(false);
        expect(isValidPhoneNumber('123')).toBe(false);
        expect(isValidPhoneNumber('abcd1234567890')).toBe(false);
        expect(isValidPhoneNumber('phone-number')).toBe(false);
      });

      it('should handle international formats', () => {
        expect(isValidPhoneNumber('+44 20 7123 1234')).toBe(true);
        expect(isValidPhoneNumber('+33 1 42 86 82 00')).toBe(true);
        expect(isValidPhoneNumber('+49 30 12345678')).toBe(true);
      });
    });
  });

  describe('New validator should not interfere with existing ones', () => {
    it('should allow all validators to work independently', () => {
      const email = 'test@example.com';
      const phone = '+91 9876543210';
      const pincode = '560001';
      
      // All validators should work correctly
      expect(isValidEmail(email)).toBe(true);
      expect(isValidPhoneNumber(phone)).toBe(true);
      expect(isValidIndianPincode(pincode)).toBe(true);
      
      // Calling one validator shouldn't affect others
      isValidIndianPincode('invalid');
      expect(isValidEmail(email)).toBe(true);
      expect(isValidPhoneNumber(phone)).toBe(true);
    });

    it('should not share state between validators', () => {
      // Test with invalid inputs
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidPhoneNumber('abc')).toBe(false);
      expect(isValidIndianPincode('abc123')).toBe(false);
      
      // Now test with valid inputs - should still work
      expect(isValidEmail('valid@email.com')).toBe(true);
      expect(isValidPhoneNumber('9876543210')).toBe(true);
      expect(isValidIndianPincode('110001')).toBe(true);
    });
  });

  describe('Cross-validator input testing', () => {
    it('should handle inputs meant for other validators gracefully', () => {
      const email = 'user@example.com';
      const phone = '9876543210';
      const pincode = '560001';
      
      // Email validator with phone/pincode inputs
      expect(isValidEmail(phone)).toBe(false);
      expect(isValidEmail(pincode)).toBe(false);
      
      // Phone validator with email/pincode inputs
      expect(isValidPhoneNumber(email)).toBe(false);
      expect(isValidPhoneNumber(pincode)).toBe(false);
      
      // Pincode validator with email/phone inputs
      expect(isValidIndianPincode(email)).toBe(false);
      expect(isValidIndianPincode(phone)).toBe(false);
    });
  });

  describe('Performance regression tests', () => {
    it('should maintain performance for existing validators', () => {
      const iterations = 1000;
      
      // Test email validator performance
      const emailStart = Date.now();
      for (let i = 0; i < iterations; i++) {
        isValidEmail('test@example.com');
      }
      const emailDuration = Date.now() - emailStart;
      
      // Test phone validator performance
      const phoneStart = Date.now();
      for (let i = 0; i < iterations; i++) {
        isValidPhoneNumber('9876543210');
      }
      const phoneDuration = Date.now() - phoneStart;
      
      // Test pincode validator performance
      const pincodeStart = Date.now();
      for (let i = 0; i < iterations; i++) {
        isValidIndianPincode('560001');
      }
      const pincodeDuration = Date.now() - pincodeStart;
      
      // All validators should complete 1000 iterations in less than 50ms
      expect(emailDuration).toBeLessThan(50);
      expect(phoneDuration).toBeLessThan(50);
      expect(pincodeDuration).toBeLessThan(50);
    });
  });

  describe('Module loading and exports', () => {
    it('should export all expected functions', () => {
      const validators = require('../validators');
      
      expect(validators.isValidEmail).toBeDefined();
      expect(validators.isValidPhoneNumber).toBeDefined();
      expect(validators.isValidIndianPincode).toBeDefined();
      
      expect(typeof validators.isValidEmail).toBe('function');
      expect(typeof validators.isValidPhoneNumber).toBe('function');
      expect(typeof validators.isValidIndianPincode).toBe('function');
    });

    it('should not export unexpected functions or variables', () => {
      const validators = require('../validators');
      const expectedExports = ['isValidEmail', 'isValidPhoneNumber', 'isValidIndianPincode'];
      const actualExports = Object.keys(validators);
      
      // Should only have the expected exports
      expect(actualExports.sort()).toEqual(expectedExports.sort());
    });
  });

  describe('Backward compatibility', () => {
    it('should maintain same function signatures', () => {
      // All validators should accept string and return boolean
      expect(isValidEmail.length).toBe(1); // One parameter
      expect(isValidPhoneNumber.length).toBe(1); // One parameter
      expect(isValidIndianPincode.length).toBe(1); // One parameter
      
      // Return types should be boolean
      expect(typeof isValidEmail('test')).toBe('boolean');
      expect(typeof isValidPhoneNumber('test')).toBe('boolean');
      expect(typeof isValidIndianPincode('test')).toBe('boolean');
    });

    it('should handle null and undefined inputs without throwing', () => {
      // Existing validators behavior with null/undefined
      expect(() => isValidEmail(null as any)).not.toThrow();
      expect(() => isValidEmail(undefined as any)).not.toThrow();
      expect(() => isValidPhoneNumber(null as any)).not.toThrow();
      expect(() => isValidPhoneNumber(undefined as any)).not.toThrow();
      
      // New validator should also handle gracefully
      expect(() => isValidIndianPincode(null as any)).not.toThrow();
      expect(() => isValidIndianPincode(undefined as any)).not.toThrow();
    });
  });
});
