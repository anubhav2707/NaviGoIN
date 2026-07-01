import { isValidIndianPincode } from '../../utils';

describe('Indian Pincode Validator E2E Tests', () => {
  describe('Business requirement: Validate Indian PIN codes for address forms', () => {
    it('should validate PIN codes for major Indian cities', () => {
      // Test real Indian city PIN codes
      const realPincodes = [
        { city: 'Bangalore', pincode: '560001', expected: true },
        { city: 'Delhi', pincode: '110001', expected: true },
        { city: 'Mumbai', pincode: '400001', expected: true },
        { city: 'Chennai', pincode: '600001', expected: true },
        { city: 'Kolkata', pincode: '700001', expected: true },
        { city: 'Hyderabad', pincode: '500001', expected: true },
        { city: 'Pune', pincode: '411001', expected: true },
        { city: 'Ahmedabad', pincode: '380001', expected: true },
        { city: 'Jaipur', pincode: '302001', expected: true },
        { city: 'Lucknow', pincode: '226001', expected: true }
      ];

      realPincodes.forEach(({ city, pincode, expected }) => {
        const result = isValidIndianPincode(pincode);
        expect(result).toBe(expected);
        if (result !== expected) {
          console.error(`Failed for ${city}: ${pincode}`);
        }
      });
    });

    it('should reject invalid formats commonly entered by users', () => {
      const invalidFormats = [
        { description: 'PIN with spaces', pincode: '560 001', expected: false },
        { description: 'PIN with dashes', pincode: '560-001', expected: false },
        { description: 'PIN starting with zero', pincode: '012345', expected: false },
        { description: 'Incomplete PIN', pincode: '56000', expected: false },
        { description: 'Extra digits', pincode: '5600011', expected: false },
        { description: 'Letters mixed in', pincode: '56O001', expected: false }, // O instead of 0
        { description: 'Empty input', pincode: '', expected: false },
        { description: 'Only spaces', pincode: '      ', expected: false },
        { description: 'US ZIP code format', pincode: '12345', expected: false },
        { description: 'US ZIP+4 format', pincode: '12345-6789', expected: false }
      ];

      invalidFormats.forEach(({ description, pincode, expected }) => {
        const result = isValidIndianPincode(pincode);
        expect(result).toBe(expected);
        if (result !== expected) {
          console.error(`Failed for ${description}: ${pincode}`);
        }
      });
    });
  });

  describe('User journey: Address form submission', () => {
    interface AddressForm {
      street: string;
      city: string;
      state: string;
      pincode: string;
    }

    const validateAddressForm = (form: AddressForm): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (!form.street || form.street.trim() === '') {
        errors.push('Street is required');
      }

      if (!form.city || form.city.trim() === '') {
        errors.push('City is required');
      }

      if (!form.state || form.state.trim() === '') {
        errors.push('State is required');
      }

      if (!isValidIndianPincode(form.pincode)) {
        errors.push('Invalid PIN code');
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    };

    it('should validate complete address forms with valid PIN codes', () => {
      const validForms: AddressForm[] = [
        {
          street: '123 MG Road',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001'
        },
        {
          street: '456 Connaught Place',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110001'
        },
        {
          street: '789 Marine Drive',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        }
      ];

      validForms.forEach((form) => {
        const validation = validateAddressForm(form);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });
    });

    it('should reject address forms with invalid PIN codes', () => {
      const invalidForms = [
        {
          form: {
            street: '123 MG Road',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '012345' // Starts with 0
          },
          expectedError: 'Invalid PIN code'
        },
        {
          form: {
            street: '456 Park Street',
            city: 'Kolkata',
            state: 'West Bengal',
            pincode: '70000' // Too short
          },
          expectedError: 'Invalid PIN code'
        },
        {
          form: {
            street: '789 Anna Salai',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '600 001' // Contains space
          },
          expectedError: 'Invalid PIN code'
        },
        {
          form: {
            street: '321 Brigade Road',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '' // Empty
          },
          expectedError: 'Invalid PIN code'
        }
      ];

      invalidForms.forEach(({ form, expectedError }) => {
        const validation = validateAddressForm(form);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain(expectedError);
      });
    });
  });

  describe('Acceptance criteria verification', () => {
    it('should pass all specified acceptance criteria', () => {
      // Direct verification of acceptance criteria
      expect(isValidIndianPincode('560001')).toBe(true);
      expect(isValidIndianPincode('110001')).toBe(true);
      expect(isValidIndianPincode('012345')).toBe(false);
      expect(isValidIndianPincode('12345')).toBe(false);
      expect(isValidIndianPincode('1234567')).toBe(false);
      expect(isValidIndianPincode('56a001')).toBe(false);
      expect(isValidIndianPincode('')).toBe(false);
    });
  });

  describe('Regression prevention', () => {
    it('should maintain backward compatibility with existing valid PIN codes', () => {
      // These PIN codes should always remain valid
      const stablePincodes = [
        '100001', '200001', '300001', '400001', '500001',
        '600001', '700001', '800001', '900001',
        '110011', '220022', '330033', '440044', '550055',
        '660066', '770077', '880088', '990099'
      ];

      stablePincodes.forEach(pincode => {
        expect(isValidIndianPincode(pincode)).toBe(true);
      });
    });

    it('should maintain backward compatibility with invalid PIN codes', () => {
      // These should always remain invalid
      const invalidPincodes = [
        '000000', '000001', '099999', '012345',
        '1', '12', '123', '1234', '12345',
        '1234567', '12345678', '123456789',
        'abcdef', '12345a', 'a23456', '1234 6', '123-456'
      ];

      invalidPincodes.forEach(pincode => {
        expect(isValidIndianPincode(pincode)).toBe(false);
      });
    });
  });
});
