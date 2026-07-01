import * as validators from '../../validators';
import * as utils from '../../index';

describe('Validators Integration Tests', () => {
  describe('Module exports', () => {
    it('should export all validator functions from validators module', () => {
      expect(typeof validators.isValidEmail).toBe('function');
      expect(typeof validators.isValidIndianMobile).toBe('function');
      expect(typeof validators.isValidIndianPincode).toBe('function');
      expect(typeof validators.isValidOTP).toBe('function');
      expect(typeof validators.isValidURL).toBe('function');
      expect(typeof validators.isValidUPI).toBe('function');
      expect(typeof validators.isValidVehicleRegistration).toBe('function');
    });

    it('should export validators through utils index', () => {
      expect(typeof utils.isValidEmail).toBe('function');
      expect(typeof utils.isValidIndianMobile).toBe('function');
      expect(typeof utils.isValidIndianPincode).toBe('function');
      expect(typeof utils.isValidOTP).toBe('function');
      expect(typeof utils.isValidURL).toBe('function');
      expect(typeof utils.isValidUPI).toBe('function');
      expect(typeof utils.isValidVehicleRegistration).toBe('function');
    });

    it('should have consistent behavior between direct and index imports', () => {
      // Test Indian Pincode validator consistency
      expect(validators.isValidIndianPincode('560001')).toBe(utils.isValidIndianPincode('560001'));
      expect(validators.isValidIndianPincode('012345')).toBe(utils.isValidIndianPincode('012345'));
      expect(validators.isValidIndianPincode('')).toBe(utils.isValidIndianPincode(''));
      
      // Test other validators consistency
      expect(validators.isValidEmail('test@example.com')).toBe(utils.isValidEmail('test@example.com'));
      expect(validators.isValidIndianMobile('9876543210')).toBe(utils.isValidIndianMobile('9876543210'));
    });
  });

  describe('Validator combinations', () => {
    it('should validate complete user registration data', () => {
      const registrationData = {
        email: 'user@example.com',
        mobile: '9876543210',
        pincode: '560001'
      };

      expect(validators.isValidEmail(registrationData.email)).toBe(true);
      expect(validators.isValidIndianMobile(registrationData.mobile)).toBe(true);
      expect(validators.isValidIndianPincode(registrationData.pincode)).toBe(true);
    });

    it('should reject invalid registration data', () => {
      const invalidData = {
        email: 'invalid-email',
        mobile: '1234567890', // starts with 1
        pincode: '012345' // starts with 0
      };

      expect(validators.isValidEmail(invalidData.email)).toBe(false);
      expect(validators.isValidIndianMobile(invalidData.mobile)).toBe(false);
      expect(validators.isValidIndianPincode(invalidData.pincode)).toBe(false);
    });

    it('should validate address components', () => {
      const address = {
        pincode: '110001',
        phone: '8123456789'
      };

      expect(validators.isValidIndianPincode(address.pincode)).toBe(true);
      expect(validators.isValidIndianMobile(address.phone)).toBe(true);
    });

    it('should validate payment details', () => {
      const paymentData = {
        upiId: 'user@paytm',
        mobile: '7000000000'
      };

      expect(validators.isValidUPI(paymentData.upiId)).toBe(true);
      expect(validators.isValidIndianMobile(paymentData.mobile)).toBe(true);
    });
  });

  describe('Formatter and validator integration', () => {
    it('should format and validate PIN codes', () => {
      const rawPincode = '560001';
      
      // Validate first
      expect(validators.isValidIndianPincode(rawPincode)).toBe(true);
      
      // Then format for display
      const formatted = utils.formatPincode(rawPincode);
      expect(formatted).toBe('560 001');
      
      // Formatted version should not be valid (contains space)
      expect(validators.isValidIndianPincode(formatted)).toBe(false);
      
      // Should be able to clean and revalidate
      const cleaned = formatted.replace(/\s/g, '');
      expect(validators.isValidIndianPincode(cleaned)).toBe(true);
    });

    it('should format and validate phone numbers', () => {
      const rawPhone = '9876543210';
      
      // Validate first
      expect(validators.isValidIndianMobile(rawPhone)).toBe(true);
      
      // Then format for display
      const formatted = utils.formatPhoneNumber(rawPhone);
      expect(formatted).toBe('+91 98765 43210');
      
      // Extract just the 10-digit number for validation
      const extracted = formatted.replace(/\D/g, '').slice(-10);
      expect(validators.isValidIndianMobile(extracted)).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      // TypeScript will prevent null/undefined, but testing runtime behavior
      expect(validators.isValidIndianPincode(null as any)).toBe(false);
      expect(validators.isValidIndianPincode(undefined as any)).toBe(false);
      
      expect(validators.isValidEmail(null as any)).toBe(false);
      expect(validators.isValidEmail(undefined as any)).toBe(false);
      
      expect(validators.isValidIndianMobile(null as any)).toBe(false);
      expect(validators.isValidIndianMobile(undefined as any)).toBe(false);
    });

    it('should handle non-string inputs', () => {
      expect(validators.isValidIndianPincode(560001 as any)).toBe(false);
      expect(validators.isValidIndianPincode({} as any)).toBe(false);
      expect(validators.isValidIndianPincode([] as any)).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should validate PIN codes efficiently in bulk', () => {
      const testCases = [
        '560001', '110001', '400001', '700001', '600001',
        '012345', '000000', '999999', '12345', '1234567'
      ];

      const start = Date.now();
      const results = testCases.map(pincode => validators.isValidIndianPincode(pincode));
      const end = Date.now();

      expect(end - start).toBeLessThan(10); // Should complete in less than 10ms
      expect(results).toEqual([
        true, true, true, true, true,
        false, false, true, false, false
      ]);
    });
  });
});