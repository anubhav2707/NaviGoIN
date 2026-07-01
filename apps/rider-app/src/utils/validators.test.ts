import {
  isValidEmail,
  isValidIndianMobile,
  isValidIndianPincode,
  isValidOTP,
  isValidURL,
  isValidUPI,
  isValidVehicleRegistration
} from './validators';

describe('Validators', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@example.co.in')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
    });
  });

  describe('isValidIndianMobile', () => {
    it('should return true for valid Indian mobile numbers', () => {
      expect(isValidIndianMobile('9876543210')).toBe(true);
      expect(isValidIndianMobile('8123456789')).toBe(true);
      expect(isValidIndianMobile('7000000000')).toBe(true);
      expect(isValidIndianMobile('6999999999')).toBe(true);
    });

    it('should return false for invalid Indian mobile numbers', () => {
      expect(isValidIndianMobile('')).toBe(false);
      expect(isValidIndianMobile('5123456789')).toBe(false); // starts with 5
      expect(isValidIndianMobile('987654321')).toBe(false); // 9 digits
      expect(isValidIndianMobile('98765432101')).toBe(false); // 11 digits
      expect(isValidIndianMobile('987654321a')).toBe(false); // contains letter
    });
  });

  describe('isValidIndianPincode', () => {
    it('should return true for valid Indian PIN codes', () => {
      expect(isValidIndianPincode('560001')).toBe(true);
      expect(isValidIndianPincode('110001')).toBe(true);
      expect(isValidIndianPincode('999999')).toBe(true);
      expect(isValidIndianPincode('100000')).toBe(true);
      expect(isValidIndianPincode('123456')).toBe(true);
    });

    it('should return false for PIN codes starting with 0', () => {
      expect(isValidIndianPincode('012345')).toBe(false);
      expect(isValidIndianPincode('000001')).toBe(false);
      expect(isValidIndianPincode('099999')).toBe(false);
    });

    it('should return false for invalid lengths', () => {
      expect(isValidIndianPincode('12345')).toBe(false); // too short
      expect(isValidIndianPincode('1234567')).toBe(false); // too long
      expect(isValidIndianPincode('123')).toBe(false); // way too short
      expect(isValidIndianPincode('12345678901')).toBe(false); // way too long
    });

    it('should return false for non-digit characters', () => {
      expect(isValidIndianPincode('56a001')).toBe(false);
      expect(isValidIndianPincode('56-001')).toBe(false);
      expect(isValidIndianPincode('56 001')).toBe(false);
      expect(isValidIndianPincode('5600.1')).toBe(false);
      expect(isValidIndianPincode('ABCDEF')).toBe(false);
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

    // Testing all acceptance criteria explicitly
    it('should satisfy all acceptance criteria', () => {
      expect(isValidIndianPincode('560001')).toBe(true);
      expect(isValidIndianPincode('110001')).toBe(true);
      expect(isValidIndianPincode('012345')).toBe(false);
      expect(isValidIndianPincode('12345')).toBe(false);
      expect(isValidIndianPincode('1234567')).toBe(false);
      expect(isValidIndianPincode('56a001')).toBe(false);
      expect(isValidIndianPincode('')).toBe(false);
    });
  });

  describe('isValidOTP', () => {
    it('should return true for valid 6-digit OTPs', () => {
      expect(isValidOTP('123456')).toBe(true);
      expect(isValidOTP('000000')).toBe(true);
      expect(isValidOTP('999999')).toBe(true);
    });

    it('should return false for invalid OTPs', () => {
      expect(isValidOTP('')).toBe(false);
      expect(isValidOTP('12345')).toBe(false); // 5 digits
      expect(isValidOTP('1234567')).toBe(false); // 7 digits
      expect(isValidOTP('12345a')).toBe(false); // contains letter
    });
  });

  describe('isValidURL', () => {
    it('should return true for valid URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://example.com')).toBe(true);
      expect(isValidURL('https://example.com/path')).toBe(true);
      expect(isValidURL('https://example.com:8080')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidURL('')).toBe(false);
      expect(isValidURL('not a url')).toBe(false);
      expect(isValidURL('example.com')).toBe(false); // missing protocol
      expect(isValidURL('//example.com')).toBe(false);
    });
  });

  describe('isValidUPI', () => {
    it('should return true for valid UPI IDs', () => {
      expect(isValidUPI('user@paytm')).toBe(true);
      expect(isValidUPI('user.name@upi')).toBe(true);
      expect(isValidUPI('user_123@bank')).toBe(true);
      expect(isValidUPI('user-name@icici')).toBe(true);
    });

    it('should return false for invalid UPI IDs', () => {
      expect(isValidUPI('')).toBe(false);
      expect(isValidUPI('user')).toBe(false); // missing @
      expect(isValidUPI('@bank')).toBe(false); // missing username
      expect(isValidUPI('user@')).toBe(false); // missing bank
      expect(isValidUPI('user @bank')).toBe(false); // space in username
    });
  });

  describe('isValidVehicleRegistration', () => {
    it('should return true for valid vehicle registration numbers', () => {
      expect(isValidVehicleRegistration('KA01AB1234')).toBe(true);
      expect(isValidVehicleRegistration('DL12C5678')).toBe(true);
      expect(isValidVehicleRegistration('MH02CD9999')).toBe(true);
    });

    it('should return false for invalid vehicle registration numbers', () => {
      expect(isValidVehicleRegistration('')).toBe(false);
      expect(isValidVehicleRegistration('KA011234')).toBe(false); // missing letters
      expect(isValidVehicleRegistration('K01AB1234')).toBe(false); // single letter at start
      expect(isValidVehicleRegistration('KA01AB123')).toBe(false); // 3 digits at end
    });
  });
});