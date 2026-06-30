import { isValidIndianMobile } from '../validators';

describe('isValidIndianMobile', () => {
  describe('Valid Indian mobile numbers', () => {
    // Basic valid numbers
    test('should return true for valid 10-digit number starting with 9', () => {
      expect(isValidIndianMobile('9876543210')).toBe(true);
    });

    test('should return true for valid 10-digit number starting with 8', () => {
      expect(isValidIndianMobile('8765432109')).toBe(true);
    });

    test('should return true for valid 10-digit number starting with 7', () => {
      expect(isValidIndianMobile('7654321098')).toBe(true);
    });

    test('should return true for valid 10-digit number starting with 6', () => {
      expect(isValidIndianMobile('6543210987')).toBe(true);
    });

    // With country code
    test('should return true for number with +91 prefix', () => {
      expect(isValidIndianMobile('+919876543210')).toBe(true);
    });

    test('should return true for number with 91 prefix (12 digits total)', () => {
      expect(isValidIndianMobile('919876543210')).toBe(true);
    });

    test('should return true for number with 0091 prefix', () => {
      expect(isValidIndianMobile('00919876543210')).toBe(true);
    });

    // With formatting
    test('should return true for number with spaces', () => {
      expect(isValidIndianMobile('98765 43210')).toBe(true);
    });

    test('should return true for number with multiple spaces', () => {
      expect(isValidIndianMobile('9 8 7 6 5 4 3 2 1 0')).toBe(true);
    });

    test('should return true for number with hyphens', () => {
      expect(isValidIndianMobile('98765-43210')).toBe(true);
    });

    test('should return true for number with dots', () => {
      expect(isValidIndianMobile('98765.43210')).toBe(true);
    });

    test('should return true for number with parentheses', () => {
      expect(isValidIndianMobile('(98765)43210')).toBe(true);
    });

    // Complex formatting
    test('should return true for number with +91 and spaces', () => {
      expect(isValidIndianMobile('+91 98765 43210')).toBe(true);
    });

    test('should return true for number with +91 and hyphens', () => {
      expect(isValidIndianMobile('+91-98765-43210')).toBe(true);
    });

    test('should return true for number with mixed formatting', () => {
      expect(isValidIndianMobile('+91 (98765) 43-210')).toBe(true);
    });

    // Edge cases
    test('should return true for all same digits starting with 9', () => {
      expect(isValidIndianMobile('9999999999')).toBe(true);
    });

    test('should return true for all same digits starting with 6', () => {
      expect(isValidIndianMobile('6666666666')).toBe(true);
    });

    test('should return true for boundary case starting with 6', () => {
      expect(isValidIndianMobile('6000000000')).toBe(true);
    });
  });

  describe('Invalid Indian mobile numbers', () => {
    // Wrong first digit
    test('should return false for number starting with 5', () => {
      expect(isValidIndianMobile('5876543210')).toBe(false);
    });

    test('should return false for number starting with 4', () => {
      expect(isValidIndianMobile('4876543210')).toBe(false);
    });

    test('should return false for number starting with 3', () => {
      expect(isValidIndianMobile('3876543210')).toBe(false);
    });

    test('should return false for number starting with 2', () => {
      expect(isValidIndianMobile('2876543210')).toBe(false);
    });

    test('should return false for number starting with 1', () => {
      expect(isValidIndianMobile('1876543210')).toBe(false);
    });

    test('should return false for number starting with 0', () => {
      expect(isValidIndianMobile('0876543210')).toBe(false);
    });

    // Wrong length
    test('should return false for number too short (9 digits)', () => {
      expect(isValidIndianMobile('987654321')).toBe(false);
    });

    test('should return false for number too long (11 digits)', () => {
      expect(isValidIndianMobile('98765432100')).toBe(false);
    });

    test('should return false for empty string', () => {
      expect(isValidIndianMobile('')).toBe(false);
    });

    test('should return false for whitespace only', () => {
      expect(isValidIndianMobile('   ')).toBe(false);
    });

    // Invalid characters
    test('should return false for number with letters', () => {
      expect(isValidIndianMobile('98765ABC10')).toBe(false);
    });

    test('should return false for number with special characters', () => {
      expect(isValidIndianMobile('9876@43210')).toBe(false);
    });

    test('should return false for number with plus sign in middle', () => {
      expect(isValidIndianMobile('98765+43210')).toBe(false);
    });

    // Invalid country code handling
    test('should return false for +91 with less than 10 digits', () => {
      expect(isValidIndianMobile('+91987654321')).toBe(false);
    });

    test('should return false for +91 with more than 10 digits', () => {
      expect(isValidIndianMobile('+9198765432100')).toBe(false);
    });

    test('should return false for 91 prefix with wrong total length', () => {
      expect(isValidIndianMobile('91987654321')).toBe(false);
    });

    // Type checking
    test('should return false for null', () => {
      expect(isValidIndianMobile(null as any)).toBe(false);
    });

    test('should return false for undefined', () => {
      expect(isValidIndianMobile(undefined as any)).toBe(false);
    });

    test('should return false for number type', () => {
      expect(isValidIndianMobile(9876543210 as any)).toBe(false);
    });

    test('should return false for object', () => {
      expect(isValidIndianMobile({} as any)).toBe(false);
    });

    test('should return false for array', () => {
      expect(isValidIndianMobile([] as any)).toBe(false);
    });
  });

  describe('Real-world scenarios', () => {
    test('should handle typical formatted number from user input', () => {
      expect(isValidIndianMobile('+91-98765-43210')).toBe(true);
    });

    test('should handle number copied from contact list', () => {
      expect(isValidIndianMobile('+91 (98765) 43210')).toBe(true);
    });

    test('should handle number with country code variation', () => {
      expect(isValidIndianMobile('0091-9876543210')).toBe(true);
    });

    test('should reject international numbers', () => {
      expect(isValidIndianMobile('+1-555-123-4567')).toBe(false);
    });

    test('should reject landline numbers', () => {
      expect(isValidIndianMobile('011-23456789')).toBe(false);
    });
  });
});
