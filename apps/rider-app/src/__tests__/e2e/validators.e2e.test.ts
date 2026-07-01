import { isValidIndianPincode } from '../../utils/validators';
import * as utils from '../../utils';

/**
 * End-to-end tests for the Indian PIN code validator
 * These tests verify the complete business requirements from SCRUM-20
 */
describe('Indian PIN Code Validator E2E Tests', () => {
  describe('Business Requirement: Validate Indian postal codes', () => {
    describe('Acceptance Criteria Verification', () => {
      it('should accept valid PIN code 560001 (Bangalore)', () => {
        const result = isValidIndianPincode('560001');
        expect(result).toBe(true);
      });

      it('should accept valid PIN code 110001 (Delhi)', () => {
        const result = isValidIndianPincode('110001');
        expect(result).toBe(true);
      });

      it('should reject PIN code starting with 0 (012345)', () => {
        const result = isValidIndianPincode('012345');
        expect(result).toBe(false);
      });

      it('should reject PIN code with insufficient digits (12345)', () => {
        const result = isValidIndianPincode('12345');
        expect(result).toBe(false);
      });

      it('should reject PIN code with too many digits (1234567)', () => {
        const result = isValidIndianPincode('1234567');
        expect(result).toBe(false);
      });

      it('should reject PIN code with non-digit characters (56a001)', () => {
        const result = isValidIndianPincode('56a001');
        expect(result).toBe(false);
      });

      it('should reject empty string', () => {
        const result = isValidIndianPincode('');
        expect(result).toBe(false);
      });
    });

    describe('Real-world PIN codes', () => {
      const validPincodes = [
        { code: '400001', location: 'Mumbai GPO' },
        { code: '600001', location: 'Chennai GPO' },
        { code: '700001', location: 'Kolkata GPO' },
        { code: '500001', location: 'Hyderabad GPO' },
        { code: '380001', location: 'Ahmedabad' },
        { code: '226001', location: 'Lucknow' },
        { code: '302001', location: 'Jaipur' },
        { code: '800001', location: 'Patna' },
        { code: '999999', location: 'Maximum valid' },
        { code: '100000', location: 'Minimum valid' }
      ];

      validPincodes.forEach(({ code, location }) => {
        it(`should accept valid PIN code ${code} (${location})`, () => {
          expect(isValidIndianPincode(code)).toBe(true);
        });
      });

      const invalidPincodes = [
        { code: '000001', reason: 'starts with 0' },
        { code: '099999', reason: 'starts with 0' },
        { code: '1000000', reason: '7 digits' },
        { code: '10000', reason: '5 digits' },
        { code: 'ABCDEF', reason: 'all letters' },
        { code: '12-3456', reason: 'contains hyphen' },
        { code: '12 3456', reason: 'contains space' },
        { code: '123.456', reason: 'contains dot' },
        { code: '12345६', reason: 'contains non-ASCII digit' }
      ];

      invalidPincodes.forEach(({ code, reason }) => {
        it(`should reject invalid PIN code ${code} (${reason})`, () => {
          expect(isValidIndianPincode(code)).toBe(false);
        });
      });
    });

    describe('User input scenarios', () => {
      it('should handle user copying PIN code with spaces', () => {
        const userInput = ' 560001 ';
        const trimmed = userInput.trim();
        expect(isValidIndianPincode(trimmed)).toBe(true);
        expect(isValidIndianPincode(userInput)).toBe(false); // with spaces
      });

      it('should validate PIN code from form input', () => {
        const formData = {
          address: '123 Main Street',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001'
        };

        expect(isValidIndianPincode(formData.pincode)).toBe(true);
      });

      it('should reject PIN code with common typos', () => {
        expect(isValidIndianPincode('56OOO1')).toBe(false); // O instead of 0
        expect(isValidIndianPincode('56000l')).toBe(false); // l instead of 1
        expect(isValidIndianPincode('5600O1')).toBe(false); // O instead of 0
      });
    });

    describe('Integration with utils module', () => {
      it('should be accessible through utils index', () => {
        expect(typeof utils.isValidIndianPincode).toBe('function');
        expect(utils.isValidIndianPincode('560001')).toBe(true);
        expect(utils.isValidIndianPincode('012345')).toBe(false);
      });

      it('should work with PIN code formatter', () => {
        const pincode = '560001';
        
        // Validate raw PIN code
        expect(utils.isValidIndianPincode(pincode)).toBe(true);
        
        // Format for display
        const formatted = utils.formatPincode(pincode);
        expect(formatted).toBe('560 001');
        
        // Remove formatting for validation
        const cleaned = formatted.replace(/\s/g, '');
        expect(utils.isValidIndianPincode(cleaned)).toBe(true);
      });
    });

    describe('API integration scenario', () => {
      it('should validate PIN codes before API submission', () => {
        const apiPayload = {
          deliveryAddress: {
            line1: '123 Main Street',
            line2: 'Apartment 4B',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001'
          },
          billingAddress: {
            line1: '456 Corporate Blvd',
            line2: 'Suite 200',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
          }
        };

        // Validate both PIN codes before sending to API
        const deliveryValid = isValidIndianPincode(apiPayload.deliveryAddress.pincode);
        const billingValid = isValidIndianPincode(apiPayload.billingAddress.pincode);

        expect(deliveryValid).toBe(true);
        expect(billingValid).toBe(true);
        expect(deliveryValid && billingValid).toBe(true); // Both must be valid
      });

      it('should prevent API submission with invalid PIN codes', () => {
        const invalidPayload = {
          address: {
            pincode: '012345' // Invalid: starts with 0
          }
        };

        const isValid = isValidIndianPincode(invalidPayload.address.pincode);
        expect(isValid).toBe(false);
        
        // In real app, this would prevent form submission
        const canSubmit = isValid;
        expect(canSubmit).toBe(false);
      });
    });

    describe('Regression tests', () => {
      it('should not break existing validator exports', () => {
        // Ensure all validators are still exported
        expect(typeof utils.isValidEmail).toBe('function');
        expect(typeof utils.isValidIndianMobile).toBe('function');
        expect(typeof utils.isValidOTP).toBe('function');
        expect(typeof utils.isValidURL).toBe('function');
        expect(typeof utils.isValidUPI).toBe('function');
        expect(typeof utils.isValidVehicleRegistration).toBe('function');
      });

      it('should not affect other validators behavior', () => {
        // Test that other validators still work correctly
        expect(utils.isValidEmail('test@example.com')).toBe(true);
        expect(utils.isValidIndianMobile('9876543210')).toBe(true);
        expect(utils.isValidOTP('123456')).toBe(true);
      });

      it('should maintain consistent return types', () => {
        // All validators should return boolean
        expect(typeof isValidIndianPincode('560001')).toBe('boolean');
        expect(typeof isValidIndianPincode('invalid')).toBe('boolean');
        expect(typeof isValidIndianPincode('')).toBe('boolean');
      });
    });
  });
});