import * as validators from '../validators';
import * as utils from '../index';

describe('Validators Integration Tests', () => {
  describe('Module exports', () => {
    it('should export isValidIndianPincode from validators module', () => {
      expect(validators.isValidIndianPincode).toBeDefined();
      expect(typeof validators.isValidIndianPincode).toBe('function');
    });

    it('should export isValidIndianPincode from index', () => {
      expect(utils.isValidIndianPincode).toBeDefined();
      expect(typeof utils.isValidIndianPincode).toBe('function');
    });

    it('should have the same implementation in both exports', () => {
      expect(validators.isValidIndianPincode).toBe(utils.isValidIndianPincode);
    });

    it('should export all validator functions', () => {
      expect(validators.isValidEmail).toBeDefined();
      expect(validators.isValidPhone).toBeDefined();
      expect(validators.isValidIndianPincode).toBeDefined();
    });
  });

  describe('Integration with other validators', () => {
    it('should work alongside other validators without conflicts', () => {
      const testData = {
        email: 'user@example.com',
        phone: '9876543210',
        pincode: '560001'
      };

      expect(validators.isValidEmail(testData.email)).toBe(true);
      expect(validators.isValidPhone(testData.phone)).toBe(true);
      expect(validators.isValidIndianPincode(testData.pincode)).toBe(true);
    });

    it('should handle invalid data correctly across all validators', () => {
      const invalidData = {
        email: 'invalid-email',
        phone: '123',
        pincode: '012345'
      };

      expect(validators.isValidEmail(invalidData.email)).toBe(false);
      expect(validators.isValidPhone(invalidData.phone)).toBe(false);
      expect(validators.isValidIndianPincode(invalidData.pincode)).toBe(false);
    });
  });

  describe('Combined validation scenarios', () => {
    interface UserAddress {
      email: string;
      phone: string;
      pincode: string;
    }

    function validateUserAddress(address: UserAddress): boolean {
      return (
        validators.isValidEmail(address.email) &&
        validators.isValidPhone(address.phone) &&
        validators.isValidIndianPincode(address.pincode)
      );
    }

    it('should validate complete user address', () => {
      const validAddress: UserAddress = {
        email: 'john@example.com',
        phone: '9876543210',
        pincode: '560001'
      };

      expect(validateUserAddress(validAddress)).toBe(true);
    });

    it('should reject address with invalid pincode', () => {
      const invalidAddress: UserAddress = {
        email: 'john@example.com',
        phone: '9876543210',
        pincode: '012345' // Invalid: starts with 0
      };

      expect(validateUserAddress(invalidAddress)).toBe(false);
    });

    it('should reject address with any invalid field', () => {
      const addresses: UserAddress[] = [
        { email: 'invalid', phone: '9876543210', pincode: '560001' },
        { email: 'john@example.com', phone: '123', pincode: '560001' },
        { email: 'john@example.com', phone: '9876543210', pincode: '12345' }
      ];

      addresses.forEach(address => {
        expect(validateUserAddress(address)).toBe(false);
      });
    });
  });

  describe('Real-world Indian pincode validation', () => {
    const realIndianPincodes = [
      '110001', // New Delhi
      '400001', // Mumbai
      '700001', // Kolkata
      '600001', // Chennai
      '560001', // Bangalore
      '500001', // Hyderabad
      '380001', // Ahmedabad
      '411001', // Pune
      '226001', // Lucknow
      '302001', // Jaipur
    ];

    it('should validate real Indian pincodes', () => {
      realIndianPincodes.forEach(pincode => {
        expect(validators.isValidIndianPincode(pincode)).toBe(true);
      });
    });

    const invalidPincodes = [
      '000000', // Cannot start with 0
      '012345', // Cannot start with 0
      '12345',  // Too short
      '1234567', // Too long
      'ABCDEF', // Non-numeric
      '56 001', // Contains space
      '56-001', // Contains special character
      '',       // Empty
    ];

    it('should reject invalid pincodes', () => {
      invalidPincodes.forEach(pincode => {
        expect(validators.isValidIndianPincode(pincode)).toBe(false);
      });
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle function composition', () => {
      const pincodes = ['560001', '012345', '110001', 'invalid', '400001'];
      const validPincodes = pincodes.filter(validators.isValidIndianPincode);
      
      expect(validPincodes).toEqual(['560001', '110001', '400001']);
    });

    it('should work with array methods', () => {
      const data = [
        { city: 'Bangalore', pincode: '560001' },
        { city: 'Invalid', pincode: '012345' },
        { city: 'Delhi', pincode: '110001' },
      ];

      const validCities = data
        .filter(item => validators.isValidIndianPincode(item.pincode))
        .map(item => item.city);

      expect(validCities).toEqual(['Bangalore', 'Delhi']);
    });

    it('should handle rapid successive calls', () => {
      const results: boolean[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(validators.isValidIndianPincode('560001'));
        results.push(validators.isValidIndianPincode('012345'));
      }

      expect(results.filter(r => r === true).length).toBe(100);
      expect(results.filter(r => r === false).length).toBe(100);
    });
  });

  describe('Type safety', () => {
    it('should only accept string parameters', () => {
      // TypeScript will enforce this at compile time
      // These tests ensure runtime behavior matches
      expect(validators.isValidIndianPincode('560001')).toBe(true);
      expect(validators.isValidIndianPincode('')).toBe(false);
    });

    it('should return boolean values', () => {
      const result1 = validators.isValidIndianPincode('560001');
      const result2 = validators.isValidIndianPincode('invalid');
      
      expect(typeof result1).toBe('boolean');
      expect(typeof result2).toBe('boolean');
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });
});