import { validateNumericInput, validatePhoneNumber, isValidIndianPincode } from './validators';

describe('validators', () => {
  describe('validateNumericInput', () => {
    it('should accept valid numeric strings', () => {
      expect(validateNumericInput('123')).toBe(true);
      expect(validateNumericInput('9876543210')).toBe(true);
      expect(validateNumericInput('0')).toBe(true);
      expect(validateNumericInput('00001')).toBe(true);
    });

    it('should reject inputs with non-digit characters', () => {
      expect(validateNumericInput('98765-43210')).toBe(false);
      expect(validateNumericInput('123.45')).toBe(false);
      expect(validateNumericInput('12a34')).toBe(false);
      expect(validateNumericInput('123 456')).toBe(false);
      expect(validateNumericInput('(123)456')).toBe(false);
      expect(validateNumericInput('+12345')).toBe(false);
    });

    it('should reject empty or invalid inputs', () => {
      expect(validateNumericInput('')).toBe(false);
      expect(validateNumericInput(' ')).toBe(false);
      expect(validateNumericInput('\t')).toBe(false);
      expect(validateNumericInput('\n')).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should accept valid 10-digit phone numbers', () => {
      expect(validatePhoneNumber('9876543210')).toBe(true);
      expect(validatePhoneNumber('1234567890')).toBe(true);
      expect(validatePhoneNumber('0000000000')).toBe(true);
    });

    it('should reject phone numbers with non-digit characters', () => {
      expect(validatePhoneNumber('98765-43210')).toBe(false);
      expect(validatePhoneNumber('(987) 654-3210')).toBe(false);
      expect(validatePhoneNumber('987.654.3210')).toBe(false);
      expect(validatePhoneNumber('+19876543210')).toBe(false);
    });

    it('should reject phone numbers with incorrect length', () => {
      expect(validatePhoneNumber('123')).toBe(false);
      expect(validatePhoneNumber('12345678901')).toBe(false);
      expect(validatePhoneNumber('')).toBe(false);
    });
  });

  describe('isValidIndianPincode', () => {
    it('should accept valid 6-digit Indian PIN codes', () => {
      expect(isValidIndianPincode('560001')).toBe(true);
      expect(isValidIndianPincode('110001')).toBe(true);
      expect(isValidIndianPincode('400001')).toBe(true);
      expect(isValidIndianPincode('999999')).toBe(true);
      // First digit is 1-9, remaining digits may be zero
      expect(isValidIndianPincode('100000')).toBe(true);
    });

    it('should reject PIN codes that start with 0', () => {
      expect(isValidIndianPincode('012345')).toBe(false);
      expect(isValidIndianPincode('000000')).toBe(false);
      expect(isValidIndianPincode('098765')).toBe(false);
    });

    it('should reject PIN codes with incorrect length', () => {
      expect(isValidIndianPincode('12345')).toBe(false); // too short
      expect(isValidIndianPincode('1234567')).toBe(false); // too long
      expect(isValidIndianPincode('1')).toBe(false);
      expect(isValidIndianPincode('1234')).toBe(false);
    });

    it('should reject PIN codes with non-digit characters', () => {
      expect(isValidIndianPincode('56a001')).toBe(false);
      expect(isValidIndianPincode('5600 1')).toBe(false);
      expect(isValidIndianPincode('56000!')).toBe(false);
      expect(isValidIndianPincode('+56001')).toBe(false);
      expect(isValidIndianPincode('5600.1')).toBe(false);
    });

    it('should reject empty or whitespace-padded input', () => {
      expect(isValidIndianPincode('')).toBe(false);
      expect(isValidIndianPincode('   ')).toBe(false);
      expect(isValidIndianPincode(' 560001')).toBe(false);
      expect(isValidIndianPincode('560001 ')).toBe(false);
    });
  });
});
