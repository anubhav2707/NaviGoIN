import * as validators from '../../validators';
import * as utils from '../../index';

describe('Validators Integration Tests', () => {
  describe('Module exports', () => {
    it('should export all validator functions from validators module', () => {
      expect(validators.isValidEmail).toBeDefined();
      expect(validators.isValidPhoneNumber).toBeDefined();
      expect(validators.isValidIndianPincode).toBeDefined();
      
      expect(typeof validators.isValidEmail).toBe('function');
      expect(typeof validators.isValidPhoneNumber).toBe('function');
      expect(typeof validators.isValidIndianPincode).toBe('function');
    });

    it('should export all validator functions from utils index', () => {
      expect(utils.isValidEmail).toBeDefined();
      expect(utils.isValidPhoneNumber).toBeDefined();
      expect(utils.isValidIndianPincode).toBeDefined();
      
      expect(typeof utils.isValidEmail).toBe('function');
      expect(typeof utils.isValidPhoneNumber).toBe('function');
      expect(typeof utils.isValidIndianPincode).toBe('function');
    });

    it('should have consistent exports between modules', () => {
      expect(utils.isValidEmail).toBe(validators.isValidEmail);
      expect(utils.isValidPhoneNumber).toBe(validators.isValidPhoneNumber);
      expect(utils.isValidIndianPincode).toBe(validators.isValidIndianPincode);
    });
  });

  describe('Validator function signatures', () => {
    it('should have consistent function signatures', () => {
      // All validators should accept a string and return a boolean
      const testInput = '123456';
      
      expect(typeof validators.isValidEmail(testInput)).toBe('boolean');
      expect(typeof validators.isValidPhoneNumber(testInput)).toBe('boolean');
      expect(typeof validators.isValidIndianPincode(testInput)).toBe('boolean');
    });
  });

  describe('isValidIndianPincode integration', () => {
    it('should work correctly when imported from different modules', () => {
      const testCases = [
        { input: '560001', expected: true },
        { input: '012345', expected: false },
        { input: '12345', expected: false },
        { input: '56a001', expected: false },
        { input: '', expected: false },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(validators.isValidIndianPincode(input)).toBe(expected);
        expect(utils.isValidIndianPincode(input)).toBe(expected);
      });
    });

    it('should handle concurrent validations', () => {
      const inputs = ['560001', '110001', '400001', '012345', '12345', 'abcdef'];
      const results = inputs.map(input => validators.isValidIndianPincode(input));
      const expectedResults = [true, true, true, false, false, false];
      
      expect(results).toEqual(expectedResults);
    });
  });

  describe('Combined validator usage', () => {
    it('should work correctly when multiple validators are used together', () => {
      const testData = {
        email: 'user@example.com',
        phone: '+91 9876543210',
        pincode: '560001',
      };

      expect(validators.isValidEmail(testData.email)).toBe(true);
      expect(validators.isValidPhoneNumber(testData.phone)).toBe(true);
      expect(validators.isValidIndianPincode(testData.pincode)).toBe(true);
    });

    it('should handle invalid combined data correctly', () => {
      const testData = {
        email: 'invalid-email',
        phone: '123',
        pincode: '012345',
      };

      expect(validators.isValidEmail(testData.email)).toBe(false);
      expect(validators.isValidPhoneNumber(testData.phone)).toBe(false);
      expect(validators.isValidIndianPincode(testData.pincode)).toBe(false);
    });
  });
});
