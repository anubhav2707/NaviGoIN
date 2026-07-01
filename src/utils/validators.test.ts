import { isValidIndianPincode } from './validators';

describe('isValidIndianPincode', () => {
  describe('valid PIN codes', () => {
    it('should return true for valid PIN code 560001', () => {
      expect(isValidIndianPincode('560001')).toBe(true);
    });

    it('should return true for valid PIN code 110001', () => {
      expect(isValidIndianPincode('110001')).toBe(true);
    });

    it('should return true for PIN code starting with 1', () => {
      expect(isValidIndianPincode('123456')).toBe(true);
    });

    it('should return true for PIN code starting with 9', () => {
      expect(isValidIndianPincode('999999')).toBe(true);
    });

    it('should return true for PIN code with all different digits', () => {
      expect(isValidIndianPincode('123456')).toBe(true);
    });

    it('should return true for PIN code with repeated digits', () => {
      expect(isValidIndianPincode('111111')).toBe(true);
    });
  });

  describe('invalid PIN codes - starting with 0', () => {
    it('should return false for PIN code starting with 0', () => {
      expect(isValidIndianPincode('012345')).toBe(false);
    });

    it('should return false for PIN code 000000', () => {
      expect(isValidIndianPincode('000000')).toBe(false);
    });

    it('should return false for PIN code 000001', () => {
      expect(isValidIndianPincode('000001')).toBe(false);
    });
  });

  describe('invalid PIN codes - wrong length', () => {
    it('should return false for PIN code that is too short (5 digits)', () => {
      expect(isValidIndianPincode('12345')).toBe(false);
    });

    it('should return false for PIN code that is too long (7 digits)', () => {
      expect(isValidIndianPincode('1234567')).toBe(false);
    });

    it('should return false for single digit', () => {
      expect(isValidIndianPincode('1')).toBe(false);
    });

    it('should return false for two digits', () => {
      expect(isValidIndianPincode('12')).toBe(false);
    });

    it('should return false for three digits', () => {
      expect(isValidIndianPincode('123')).toBe(false);
    });

    it('should return false for four digits', () => {
      expect(isValidIndianPincode('1234')).toBe(false);
    });

    it('should return false for eight digits', () => {
      expect(isValidIndianPincode('12345678')).toBe(false);
    });
  });

  describe('invalid PIN codes - non-digit characters', () => {
    it('should return false for PIN code with letter in middle', () => {
      expect(isValidIndianPincode('56a001')).toBe(false);
    });

    it('should return false for PIN code with letter at start', () => {
      expect(isValidIndianPincode('a60001')).toBe(false);
    });

    it('should return false for PIN code with letter at end', () => {
      expect(isValidIndianPincode('56000a')).toBe(false);
    });

    it('should return false for PIN code with special characters', () => {
      expect(isValidIndianPincode('560@01')).toBe(false);
    });

    it('should return false for PIN code with spaces', () => {
      expect(isValidIndianPincode('560 01')).toBe(false);
    });

    it('should return false for PIN code with hyphens', () => {
      expect(isValidIndianPincode('560-01')).toBe(false);
    });

    it('should return false for all letters', () => {
      expect(isValidIndianPincode('abcdef')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should return false for empty string', () => {
      expect(isValidIndianPincode('')).toBe(false);
    });

    it('should return false for null-like values', () => {
      expect(isValidIndianPincode(null as any)).toBe(false);
    });

    it('should return false for undefined-like values', () => {
      expect(isValidIndianPincode(undefined as any)).toBe(false);
    });

    it('should return false for whitespace only', () => {
      expect(isValidIndianPincode('      ')).toBe(false);
    });

    it('should return false for PIN code with leading spaces', () => {
      expect(isValidIndianPincode(' 560001')).toBe(false);
    });

    it('should return false for PIN code with trailing spaces', () => {
      expect(isValidIndianPincode('560001 ')).toBe(false);
    });

    it('should return false for PIN code with decimal point', () => {
      expect(isValidIndianPincode('560.01')).toBe(false);
    });

    it('should return false for negative number string', () => {
      expect(isValidIndianPincode('-56001')).toBe(false);
    });

    it('should return false for positive sign prefix', () => {
      expect(isValidIndianPincode('+56001')).toBe(false);
    });
  });

  describe('acceptance criteria verification', () => {
    it('isValidIndianPincode("560001") should return true', () => {
      expect(isValidIndianPincode('560001')).toBe(true);
    });

    it('isValidIndianPincode("110001") should return true', () => {
      expect(isValidIndianPincode('110001')).toBe(true);
    });

    it('isValidIndianPincode("012345") should return false (starts with 0)', () => {
      expect(isValidIndianPincode('012345')).toBe(false);
    });

    it('isValidIndianPincode("12345") should return false (too short)', () => {
      expect(isValidIndianPincode('12345')).toBe(false);
    });

    it('isValidIndianPincode("1234567") should return false (too long)', () => {
      expect(isValidIndianPincode('1234567')).toBe(false);
    });

    it('isValidIndianPincode("56a001") should return false (non-digit)', () => {
      expect(isValidIndianPincode('56a001')).toBe(false);
    });

    it('isValidIndianPincode("") should return false', () => {
      expect(isValidIndianPincode('')).toBe(false);
    });
  });
});
