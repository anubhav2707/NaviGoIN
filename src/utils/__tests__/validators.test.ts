import { isValidEmail, isValidPhone, isValidIndianPincode } from '../validators';

describe('Validators Unit Tests', () => {
  describe('isValidIndianPincode', () => {
    describe('Valid pincodes', () => {
      test.each([
        ['560001', 'Bangalore pincode'],
        ['110001', 'Delhi pincode'],
        ['400001', 'Mumbai pincode'],
        ['700001', 'Kolkata pincode'],
        ['600001', 'Chennai pincode'],
        ['500001', 'Hyderabad pincode'],
        ['100000', 'minimum valid starting with 1'],
        ['999999', 'maximum valid starting with 9'],
      ])('should return true for %s (%s)', (pincode, description) => {
        expect(isValidIndianPincode(pincode)).toBe(true);
      });
    });

    describe('Invalid pincodes - wrong format', () => {
      test.each([
        ['012345', 'starts with 0'],
        ['000000', 'all zeros'],
        ['099999', 'starts with 0'],
        ['12345', 'too short (5 digits)'],
        ['1234', 'too short (4 digits)'],
        ['123', 'too short (3 digits)'],
        ['12', 'too short (2 digits)'],
        ['1', 'too short (1 digit)'],
        ['1234567', 'too long (7 digits)'],
        ['12345678', 'too long (8 digits)'],
        ['123456789', 'too long (9 digits)'],
      ])('should return false for %s (%s)', (pincode, description) => {
        expect(isValidIndianPincode(pincode)).toBe(false);
      });
    });

    describe('Invalid pincodes - non-numeric characters', () => {
      test.each([
        ['56a001', 'contains letter'],
        ['56A001', 'contains uppercase letter'],
        ['56 001', 'contains space'],
        ['56-001', 'contains hyphen'],
        ['56.001', 'contains dot'],
        ['56,001', 'contains comma'],
        ['56!001', 'contains exclamation'],
        ['56@001', 'contains at symbol'],
        ['56#001', 'contains hash'],
        ['56$001', 'contains dollar'],
        ['56%001', 'contains percent'],
        ['56^001', 'contains caret'],
        ['56&001', 'contains ampersand'],
        ['56*001', 'contains asterisk'],
        ['56(001', 'contains parenthesis'],
        ['56)001', 'contains closing parenthesis'],
        ['56_001', 'contains underscore'],
        ['56+001', 'contains plus'],
        ['56=001', 'contains equals'],
        ['56[001', 'contains bracket'],
        ['56]001', 'contains closing bracket'],
        ['56{001', 'contains brace'],
        ['56}001', 'contains closing brace'],
        ['56|001', 'contains pipe'],
        ['56\\001', 'contains backslash'],
        ['56/001', 'contains forward slash'],
        ['56:001', 'contains colon'],
        ['56;001', 'contains semicolon'],
        ['56"001', 'contains quote'],
        ["56'001", 'contains single quote'],
        ['56<001', 'contains less than'],
        ['56>001', 'contains greater than'],
        ['56?001', 'contains question mark'],
        ['56~001', 'contains tilde'],
        ['56`001', 'contains backtick'],
      ])('should return false for %s (%s)', (pincode, description) => {
        expect(isValidIndianPincode(pincode)).toBe(false);
      });
    });

    describe('Edge cases and special inputs', () => {
      test.each([
        ['', 'empty string'],
        [' ', 'single space'],
        ['      ', 'multiple spaces'],
        [' 560001', 'leading space'],
        ['560001 ', 'trailing space'],
        [' 560001 ', 'both spaces'],
        ['\t560001', 'tab character'],
        ['\n560001', 'newline character'],
        ['\r560001', 'carriage return'],
        ['null', 'string "null"'],
        ['undefined', 'string "undefined"'],
        ['NaN', 'string "NaN"'],
        ['true', 'string "true"'],
        ['false', 'string "false"'],
        ['[object Object]', 'string representation of object'],
        ['0x1234AB', 'hexadecimal string'],
        ['1.23e+5', 'scientific notation'],
        ['०१२३४५', 'Devanagari numerals'],
        ['٠١٢٣٤٥', 'Arabic numerals'],
        ['一二三四五六', 'Chinese numerals'],
      ])('should return false for %s (%s)', (pincode, description) => {
        expect(isValidIndianPincode(pincode)).toBe(false);
      });
    });

    describe('Boundary value testing', () => {
      it('should validate minimum valid pincode', () => {
        expect(isValidIndianPincode('100000')).toBe(true);
      });

      it('should validate maximum valid pincode', () => {
        expect(isValidIndianPincode('999999')).toBe(true);
      });

      it('should reject just below minimum', () => {
        expect(isValidIndianPincode('099999')).toBe(false);
      });

      it('should reject just above maximum (7 digits)', () => {
        expect(isValidIndianPincode('1000000')).toBe(false);
      });
    });

    describe('Performance tests', () => {
      it('should handle large number of validations efficiently', () => {
        const start = Date.now();
        for (let i = 0; i < 10000; i++) {
          isValidIndianPincode('560001');
          isValidIndianPincode('invalid');
        }
        const end = Date.now();
        expect(end - start).toBeLessThan(100); // Should complete in less than 100ms
      });
    });

    describe('Type coercion behavior', () => {
      it('should handle numeric strings correctly', () => {
        expect(isValidIndianPincode('560001')).toBe(true);
        expect(isValidIndianPincode('012345')).toBe(false);
      });

      it('should not accept numeric-like but invalid formats', () => {
        expect(isValidIndianPincode('5.6e+5')).toBe(false);
        expect(isValidIndianPincode('0b110001')).toBe(false);
        expect(isValidIndianPincode('0o123456')).toBe(false);
      });
    });
  });

  describe('isValidEmail', () => {
    it('should validate email addresses correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate phone numbers correctly', () => {
      expect(isValidPhone('1234567890')).toBe(true);
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });
  });
});