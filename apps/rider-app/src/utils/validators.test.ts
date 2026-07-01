import {
  isValidEmail,
  isValidPhoneNumber,
  isValidIndianPincode,
} from './validators';

describe('validators', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.co.in')).toBe(true);
      expect(isValidEmail('admin+tag@company.org')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should return true for valid phone numbers', () => {
      expect(isValidPhoneNumber('1234567890')).toBe(true);
      expect(isValidPhoneNumber('+91 9876543210')).toBe(true);
      expect(isValidPhoneNumber('(123) 456-7890')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(isValidPhoneNumber('')).toBe(false);
      expect(isValidPhoneNumber('123')).toBe(false);
      expect(isValidPhoneNumber('abcd1234567890')).toBe(false);
    });
  });

  describe('isValidIndianPincode', () => {
    it('should return true for valid Indian PIN codes', () => {
      expect(isValidIndianPincode('560001')).toBe(true);
      expect(isValidIndianPincode('110001')).toBe(true);
      expect(isValidIndianPincode('400001')).toBe(true);
      expect(isValidIndianPincode('999999')).toBe(true);
      expect(isValidIndianPincode('100000')).toBe(true);
    });

    it('should return false for PIN codes starting with 0', () => {
      expect(isValidIndianPincode('012345')).toBe(false);
      expect(isValidIndianPincode('000001')).toBe(false);
      expect(isValidIndianPincode('099999')).toBe(false);
    });

    it('should return false for invalid lengths', () => {
      expect(isValidIndianPincode('12345')).toBe(false); // too short
      expect(isValidIndianPincode('1234567')).toBe(false); // too long
      expect(isValidIndianPincode('123')).toBe(false);
      expect(isValidIndianPincode('12345678901')).toBe(false);
    });

    it('should return false for non-digit characters', () => {
      expect(isValidIndianPincode('56a001')).toBe(false);
      expect(isValidIndianPincode('56 001')).toBe(false);
      expect(isValidIndianPincode('56-001')).toBe(false);
      expect(isValidIndianPincode('5600.1')).toBe(false);
      expect(isValidIndianPincode('ABCDEF')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidIndianPincode('')).toBe(false);
    });

    // Edge cases
    it('should handle edge cases correctly', () => {
      expect(isValidIndianPincode(' ')).toBe(false);
      expect(isValidIndianPincode('\t')).toBe(false);
      expect(isValidIndianPincode('\n')).toBe(false);
      expect(isValidIndianPincode('null')).toBe(false);
      expect(isValidIndianPincode('undefined')).toBe(false);
    });

    // Boundary values
    it('should handle boundary values correctly', () => {
      expect(isValidIndianPincode('100000')).toBe(true); // minimum valid
      expect(isValidIndianPincode('999999')).toBe(true); // maximum valid
      expect(isValidIndianPincode('099999')).toBe(false); // just below minimum
    });
  });
});
