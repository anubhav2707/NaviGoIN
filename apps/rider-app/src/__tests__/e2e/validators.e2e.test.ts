import { isValidIndianPincode } from '../../utils';

// Mock form data interface
interface UserAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

// Mock address validation service
class AddressValidationService {
  validatePincode(pincode: string): boolean {
    return isValidIndianPincode(pincode);
  }

  validateAddress(address: UserAddress): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!address.street || address.street.trim().length === 0) {
      errors.push('Street address is required');
    }

    if (!address.city || address.city.trim().length === 0) {
      errors.push('City is required');
    }

    if (!address.state || address.state.trim().length === 0) {
      errors.push('State is required');
    }

    if (!this.validatePincode(address.pincode)) {
      errors.push('Invalid Indian PIN code');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Mock user registration form
class UserRegistrationForm {
  private addressValidator: AddressValidationService;

  constructor() {
    this.addressValidator = new AddressValidationService();
  }

  submitForm(address: UserAddress): { success: boolean; message: string } {
    const validation = this.addressValidator.validateAddress(address);

    if (validation.isValid) {
      // Simulate successful submission
      return {
        success: true,
        message: 'Registration successful',
      };
    } else {
      return {
        success: false,
        message: `Validation failed: ${validation.errors.join(', ')}`,
      };
    }
  }
}

describe('E2E: Indian Pincode Validator in User Registration Flow', () => {
  let registrationForm: UserRegistrationForm;
  let addressValidator: AddressValidationService;

  beforeEach(() => {
    registrationForm = new UserRegistrationForm();
    addressValidator = new AddressValidationService();
  });

  describe('Acceptance Criteria Tests', () => {
    it('should accept valid Indian PIN code 560001', () => {
      expect(isValidIndianPincode('560001')).toBe(true);
    });

    it('should accept valid Indian PIN code 110001', () => {
      expect(isValidIndianPincode('110001')).toBe(true);
    });

    it('should reject PIN code starting with 0 (012345)', () => {
      expect(isValidIndianPincode('012345')).toBe(false);
    });

    it('should reject PIN code that is too short (12345)', () => {
      expect(isValidIndianPincode('12345')).toBe(false);
    });

    it('should reject PIN code that is too long (1234567)', () => {
      expect(isValidIndianPincode('1234567')).toBe(false);
    });

    it('should reject PIN code with non-digit characters (56a001)', () => {
      expect(isValidIndianPincode('56a001')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidIndianPincode('')).toBe(false);
    });
  });

  describe('Real-world User Registration Scenarios', () => {
    it('should successfully register user with valid Bangalore address', () => {
      const bangaloreAddress: UserAddress = {
        street: '123 MG Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        country: 'India',
      };

      const result = registrationForm.submitForm(bangaloreAddress);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Registration successful');
    });

    it('should successfully register user with valid Delhi address', () => {
      const delhiAddress: UserAddress = {
        street: '456 Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        country: 'India',
      };

      const result = registrationForm.submitForm(delhiAddress);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Registration successful');
    });

    it('should fail registration with invalid PIN code starting with 0', () => {
      const invalidAddress: UserAddress = {
        street: '789 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '012345',
        country: 'India',
      };

      const result = registrationForm.submitForm(invalidAddress);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid Indian PIN code');
    });

    it('should fail registration with too short PIN code', () => {
      const invalidAddress: UserAddress = {
        street: '789 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '12345',
        country: 'India',
      };

      const result = registrationForm.submitForm(invalidAddress);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid Indian PIN code');
    });

    it('should fail registration with non-numeric PIN code', () => {
      const invalidAddress: UserAddress = {
        street: '789 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '56a001',
        country: 'India',
      };

      const result = registrationForm.submitForm(invalidAddress);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid Indian PIN code');
    });
  });

  describe('Batch Processing Scenarios', () => {
    it('should correctly validate multiple PIN codes in batch', () => {
      const pincodes = [
        { value: '560001', shouldBeValid: true },
        { value: '110001', shouldBeValid: true },
        { value: '400001', shouldBeValid: true },
        { value: '700001', shouldBeValid: true },
        { value: '012345', shouldBeValid: false },
        { value: '12345', shouldBeValid: false },
        { value: '1234567', shouldBeValid: false },
        { value: '56a001', shouldBeValid: false },
        { value: '', shouldBeValid: false },
      ];

      const results = pincodes.map(({ value }) => addressValidator.validatePincode(value));
      const expected = pincodes.map(({ shouldBeValid }) => shouldBeValid);

      expect(results).toEqual(expected);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle rapid successive validations', () => {
      const startTime = Date.now();
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        isValidIndianPincode('560001');
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete 10000 validations in less than 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should handle special string inputs gracefully', () => {
      const specialCases = [
        '\n560001',
        '560001\n',
        ' 560001',
        '560001 ',
        '\t560001',
        '560001\t',
      ];

      specialCases.forEach(testCase => {
        expect(isValidIndianPincode(testCase)).toBe(false);
      });
    });

    it('should validate all major Indian city PIN codes correctly', () => {
      const majorCityPincodes = [
        '560001', // Bangalore
        '110001', // New Delhi
        '400001', // Mumbai
        '700001', // Kolkata
        '600001', // Chennai
        '500001', // Hyderabad
        '380001', // Ahmedabad
        '411001', // Pune
      ];

      majorCityPincodes.forEach(pincode => {
        expect(isValidIndianPincode(pincode)).toBe(true);
      });
    });
  });
});
