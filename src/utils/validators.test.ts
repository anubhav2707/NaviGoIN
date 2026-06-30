import { validateNumericInput, validatePhoneNumber } from './validators';

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
});
