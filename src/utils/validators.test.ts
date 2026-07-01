import { isValidEmail, isValidPhone, isValidIndianPincode } from './validators';

describe('validators', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should return true for valid phone numbers', () => {
      expect(isValidPhone('1234567890')).toBe(true);
      expect(isValidPhone('+1-234-567-8900')).toBe(true);
      expect(isValidPhone('(123) 456-7890')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('abcdefghij')).toBe(false);
    });
  });

  describe('isValidIndianPincode', () => {
    it('should return true for valid Indian pincodes', () => {
      expect(isValidIndianPincode('560001')).toBe(true);
      expect(isValidIndianPincode('110001')).toBe(true);
      expect(isValidIndianPincode('999999')).toBe(true);
      expect(isValidIndianPincode('100000')).toBe(true);
    });

    it('should return false for pincodes starting with 0', () => {
      expect(isValidIndianPincode('012345')).toBe(false);
      expect(isValidIndianPincode('000000')).toBe(false);
      expect(isValidIndianPincode('099999')).toBe(false);
    });

    it('should return false for incorrect lengths', () => {
      expect(isValidIndianPincode('12345')).toBe(false);
      expect(isValidIndianPincode('1234567')).toBe(false);
      expect(isValidIndianPincode('12')).toBe(false);
      expect(isValidIndianPincode('12345678901')).toBe(false);
    });

    it('should return false for non-digit characters', () => {
      expect(isValidIndianPincode('56a001')).toBe(false);
      expect(isValidIndianPincode('56 001')).toBe(false);
      expect(isValidIndianPincode('56-001')).toBe(false);
      expect(isValidIndianPincode('5600.1')).toBe(false);
      expect(isValidIndianPincode('56000!')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidIndianPincode('')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidIndianPincode(' 560001')).toBe(false); // leading space
      expect(isValidIndianPincode('560001 ')).toBe(false); // trailing space
      expect(isValidIndianPincode(' 560001 ')).toBe(false); // both spaces
      expect(isValidIndianPincode('null')).toBe(false);
      expect(isValidIndianPincode('undefined')).toBe(false);
    });

    // Acceptance criteria tests
    it('should pass acceptance criteria', () => {
      expect(isValidIndianPincode('560001')).toBe(true);
      expect(isValidIndianPincode('110001')).toBe(true);
      expect(isValidIndianPincode('012345')).toBe(false);
      expect(isValidIndianPincode('12345')).toBe(false);
      expect(isValidIndianPincode('1234567')).toBe(false);
      expect(isValidIndianPincode('56a001')).toBe(false);
      expect(isValidIndianPincode('')).toBe(false);
    });
  });
});