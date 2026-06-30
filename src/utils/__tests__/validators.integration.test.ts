import { isValidIndianMobile } from '../validators';

/**
 * Integration tests for isValidIndianMobile validator
 * Tests the validator in combination with other system components
 */

describe('isValidIndianMobile Integration Tests', () => {
  describe('Form validation integration', () => {
    // Simulating form validation scenarios
    const validatePhoneField = (value: string): { valid: boolean; error?: string } => {
      if (!value) {
        return { valid: false, error: 'Phone number is required' };
      }
      
      if (!isValidIndianMobile(value)) {
        return { valid: false, error: 'Please enter a valid Indian mobile number' };
      }
      
      return { valid: true };
    };

    test('should integrate with form validation for empty input', () => {
      const result = validatePhoneField('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Phone number is required');
    });

    test('should integrate with form validation for invalid number', () => {
      const result = validatePhoneField('123456');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please enter a valid Indian mobile number');
    });

    test('should integrate with form validation for valid number', () => {
      const result = validatePhoneField('9876543210');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Data normalization integration', () => {
    // Function that uses the validator before normalizing
    const normalizePhoneNumber = (phone: string): string | null => {
      if (!isValidIndianMobile(phone)) {
        return null;
      }
      
      // Remove all formatting and country code
      let normalized = phone.replace(/[\s\-()\.]*/g, '');
      if (normalized.startsWith('+91')) {
        normalized = normalized.substring(3);
      } else if (normalized.startsWith('91') && normalized.length === 12) {
        normalized = normalized.substring(2);
      } else if (normalized.startsWith('0091')) {
        normalized = normalized.substring(4);
      }
      
      return normalized;
    };

    test('should normalize valid number with country code', () => {
      expect(normalizePhoneNumber('+91 98765 43210')).toBe('9876543210');
    });

    test('should normalize valid number without country code', () => {
      expect(normalizePhoneNumber('98765-43210')).toBe('9876543210');
    });

    test('should return null for invalid number', () => {
      expect(normalizePhoneNumber('5876543210')).toBeNull();
    });

    test('should return null for malformed input', () => {
      expect(normalizePhoneNumber('invalid')).toBeNull();
    });
  });

  describe('Bulk validation integration', () => {
    // Function that validates multiple phone numbers
    const validatePhoneList = (phones: string[]): { valid: string[]; invalid: string[] } => {
      const valid: string[] = [];
      const invalid: string[] = [];
      
      phones.forEach(phone => {
        if (isValidIndianMobile(phone)) {
          valid.push(phone);
        } else {
          invalid.push(phone);
        }
      });
      
      return { valid, invalid };
    };

    test('should validate list of mixed phone numbers', () => {
      const phones = [
        '9876543210',
        '+919876543210',
        '5876543210',
        '98765 43210',
        'invalid',
        '7654321098',
        '123456789',
        '+91-8765-432109'
      ];
      
      const result = validatePhoneList(phones);
      
      expect(result.valid).toEqual([
        '9876543210',
        '+919876543210',
        '98765 43210',
        '7654321098',
        '+91-8765-432109'
      ]);
      
      expect(result.invalid).toEqual([
        '5876543210',
        'invalid',
        '123456789'
      ]);
    });

    test('should handle empty list', () => {
      const result = validatePhoneList([]);
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual([]);
    });

    test('should handle list with all valid numbers', () => {
      const phones = ['9876543210', '8765432109', '7654321098'];
      const result = validatePhoneList(phones);
      expect(result.valid).toEqual(phones);
      expect(result.invalid).toEqual([]);
    });

    test('should handle list with all invalid numbers', () => {
      const phones = ['123', '456', '789'];
      const result = validatePhoneList(phones);
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual(phones);
    });
  });

  describe('API request integration', () => {
    // Simulating API request preparation
    interface UserRegistration {
      name: string;
      phone: string;
      isValidPhone: boolean;
    }

    const prepareRegistrationData = (name: string, phone: string): UserRegistration | null => {
      if (!name || !phone) {
        return null;
      }
      
      const isValidPhone = isValidIndianMobile(phone);
      
      if (!isValidPhone) {
        return null;
      }
      
      // Normalize phone for API
      let normalizedPhone = phone.replace(/[\s\-()\.]*/g, '');
      if (normalizedPhone.startsWith('+91')) {
        normalizedPhone = normalizedPhone.substring(3);
      } else if (normalizedPhone.startsWith('91') && normalizedPhone.length === 12) {
        normalizedPhone = normalizedPhone.substring(2);
      }
      
      return {
        name,
        phone: normalizedPhone,
        isValidPhone
      };
    };

    test('should prepare valid registration data', () => {
      const result = prepareRegistrationData('John Doe', '+91 98765 43210');
      expect(result).toEqual({
        name: 'John Doe',
        phone: '9876543210',
        isValidPhone: true
      });
    });

    test('should return null for invalid phone', () => {
      const result = prepareRegistrationData('John Doe', '5876543210');
      expect(result).toBeNull();
    });

    test('should return null for missing data', () => {
      expect(prepareRegistrationData('', '9876543210')).toBeNull();
      expect(prepareRegistrationData('John Doe', '')).toBeNull();
    });
  });

  describe('Database query integration', () => {
    // Simulating database query building
    const buildPhoneSearchQuery = (searchTerm: string): string | null => {
      // Only build query if the search term is a valid phone number
      if (!isValidIndianMobile(searchTerm)) {
        return null;
      }
      
      // Normalize for database search
      let normalized = searchTerm.replace(/[\s\-()\.]*/g, '');
      if (normalized.startsWith('+91')) {
        normalized = normalized.substring(3);
      } else if (normalized.startsWith('91') && normalized.length === 12) {
        normalized = normalized.substring(2);
      }
      
      return `SELECT * FROM users WHERE phone = '${normalized}' OR phone = '+91${normalized}'`;
    };

    test('should build query for valid phone number', () => {
      const query = buildPhoneSearchQuery('9876543210');
      expect(query).toBe("SELECT * FROM users WHERE phone = '9876543210' OR phone = '+919876543210'");
    });

    test('should build query for formatted phone number', () => {
      const query = buildPhoneSearchQuery('+91 98765 43210');
      expect(query).toBe("SELECT * FROM users WHERE phone = '9876543210' OR phone = '+919876543210'");
    });

    test('should return null for invalid phone number', () => {
      expect(buildPhoneSearchQuery('123456')).toBeNull();
      expect(buildPhoneSearchQuery('invalid')).toBeNull();
    });
  });
});
