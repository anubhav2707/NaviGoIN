import { isValidIndianMobile } from '../validators';

/**
 * End-to-end tests for isValidIndianMobile validator
 * Tests complete user flows and business requirements from SCRUM-11
 */

describe('isValidIndianMobile E2E Tests - SCRUM-11 Requirements', () => {
  describe('User Registration Flow', () => {
    // Simulate complete user registration flow
    class UserRegistrationFlow {
      private phoneNumber: string = '';
      private errors: string[] = [];

      enterPhoneNumber(phone: string): this {
        this.phoneNumber = phone;
        return this;
      }

      validate(): this {
        this.errors = [];
        
        if (!this.phoneNumber) {
          this.errors.push('Phone number is required');
        } else if (!isValidIndianMobile(this.phoneNumber)) {
          this.errors.push('Please enter a valid Indian mobile number (10 digits, starting with 6-9)');
        }
        
        return this;
      }

      getErrors(): string[] {
        return this.errors;
      }

      canProceed(): boolean {
        return this.errors.length === 0;
      }

      getNormalizedPhone(): string | null {
        if (!this.canProceed()) {
          return null;
        }
        
        // Normalize the phone number for storage
        let normalized = this.phoneNumber.replace(/[\s\-()\.]*/g, '');
        if (normalized.startsWith('+91')) {
          normalized = normalized.substring(3);
        } else if (normalized.startsWith('91') && normalized.length === 12) {
          normalized = normalized.substring(2);
        } else if (normalized.startsWith('0091')) {
          normalized = normalized.substring(4);
        }
        
        return normalized;
      }
    }

    test('should complete registration with valid unformatted number', () => {
      const flow = new UserRegistrationFlow();
      
      flow.enterPhoneNumber('9876543210').validate();
      
      expect(flow.getErrors()).toEqual([]);
      expect(flow.canProceed()).toBe(true);
      expect(flow.getNormalizedPhone()).toBe('9876543210');
    });

    test('should complete registration with formatted number', () => {
      const flow = new UserRegistrationFlow();
      
      flow.enterPhoneNumber('+91 98765 43210').validate();
      
      expect(flow.getErrors()).toEqual([]);
      expect(flow.canProceed()).toBe(true);
      expect(flow.getNormalizedPhone()).toBe('9876543210');
    });

    test('should block registration with invalid number', () => {
      const flow = new UserRegistrationFlow();
      
      flow.enterPhoneNumber('5876543210').validate();
      
      expect(flow.getErrors()).toEqual(['Please enter a valid Indian mobile number (10 digits, starting with 6-9)']);
      expect(flow.canProceed()).toBe(false);
      expect(flow.getNormalizedPhone()).toBeNull();
    });

    test('should block registration with empty input', () => {
      const flow = new UserRegistrationFlow();
      
      flow.enterPhoneNumber('').validate();
      
      expect(flow.getErrors()).toEqual(['Phone number is required']);
      expect(flow.canProceed()).toBe(false);
      expect(flow.getNormalizedPhone()).toBeNull();
    });
  });

  describe('OTP Verification Flow', () => {
    // Simulate OTP sending flow
    class OTPFlow {
      private phoneNumber: string = '';
      private otpSent: boolean = false;
      private formattedPhone: string = '';

      async sendOTP(phone: string): Promise<{ success: boolean; message: string; displayNumber?: string }> {
        if (!isValidIndianMobile(phone)) {
          return {
            success: false,
            message: 'Invalid phone number. Please enter a valid 10-digit Indian mobile number.'
          };
        }

        // Normalize and format for display
        let normalized = phone.replace(/[\s\-()\.]*/g, '');
        if (normalized.startsWith('+91')) {
          normalized = normalized.substring(3);
        } else if (normalized.startsWith('91') && normalized.length === 12) {
          normalized = normalized.substring(2);
        } else if (normalized.startsWith('0091')) {
          normalized = normalized.substring(4);
        }

        this.phoneNumber = normalized;
        this.formattedPhone = `+91-${normalized.substring(0, 5)}-${normalized.substring(5)}`;
        this.otpSent = true;

        return {
          success: true,
          message: `OTP sent successfully`,
          displayNumber: this.formattedPhone
        };
      }

      isOTPSent(): boolean {
        return this.otpSent;
      }

      getFormattedPhone(): string {
        return this.formattedPhone;
      }
    }

    test('should send OTP for valid number', async () => {
      const flow = new OTPFlow();
      const result = await flow.sendOTP('9876543210');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP sent successfully');
      expect(result.displayNumber).toBe('+91-98765-43210');
      expect(flow.isOTPSent()).toBe(true);
    });

    test('should send OTP for formatted number', async () => {
      const flow = new OTPFlow();
      const result = await flow.sendOTP('+91 98765 43210');
      
      expect(result.success).toBe(true);
      expect(result.displayNumber).toBe('+91-98765-43210');
      expect(flow.isOTPSent()).toBe(true);
    });

    test('should not send OTP for invalid number', async () => {
      const flow = new OTPFlow();
      const result = await flow.sendOTP('123456');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid phone number. Please enter a valid 10-digit Indian mobile number.');
      expect(result.displayNumber).toBeUndefined();
      expect(flow.isOTPSent()).toBe(false);
    });
  });

  describe('Contact Import Flow', () => {
    // Simulate importing contacts from various sources
    interface Contact {
      name: string;
      phone: string;
      isValid?: boolean;
      normalized?: string;
    }

    class ContactImporter {
      importContacts(contacts: Contact[]): { valid: Contact[]; invalid: Contact[]; stats: { total: number; valid: number; invalid: number } } {
        const valid: Contact[] = [];
        const invalid: Contact[] = [];

        contacts.forEach(contact => {
          if (isValidIndianMobile(contact.phone)) {
            // Normalize the phone number
            let normalized = contact.phone.replace(/[\s\-()\.]*/g, '');
            if (normalized.startsWith('+91')) {
              normalized = normalized.substring(3);
            } else if (normalized.startsWith('91') && normalized.length === 12) {
              normalized = normalized.substring(2);
            } else if (normalized.startsWith('0091')) {
              normalized = normalized.substring(4);
            }

            valid.push({
              ...contact,
              isValid: true,
              normalized
            });
          } else {
            invalid.push({
              ...contact,
              isValid: false
            });
          }
        });

        return {
          valid,
          invalid,
          stats: {
            total: contacts.length,
            valid: valid.length,
            invalid: invalid.length
          }
        };
      }
    }

    test('should import mixed contact list', () => {
      const importer = new ContactImporter();
      const contacts: Contact[] = [
        { name: 'John', phone: '9876543210' },
        { name: 'Jane', phone: '+91 98765 43210' },
        { name: 'Bob', phone: '5876543210' },
        { name: 'Alice', phone: '(98765) 43210' },
        { name: 'Charlie', phone: '123' },
        { name: 'David', phone: '7654321098' }
      ];

      const result = importer.importContacts(contacts);

      expect(result.stats).toEqual({
        total: 6,
        valid: 4,
        invalid: 2
      });

      expect(result.valid).toHaveLength(4);
      expect(result.valid[0]).toEqual({
        name: 'John',
        phone: '9876543210',
        isValid: true,
        normalized: '9876543210'
      });
      expect(result.valid[1].normalized).toBe('9876543210');

      expect(result.invalid).toHaveLength(2);
      expect(result.invalid[0].name).toBe('Bob');
      expect(result.invalid[1].name).toBe('Charlie');
    });
  });

  describe('Search and Filter Flow', () => {
    // Simulate searching users by phone number
    interface User {
      id: string;
      name: string;
      phone: string;
    }

    class UserSearch {
      private users: User[] = [
        { id: '1', name: 'User One', phone: '9876543210' },
        { id: '2', name: 'User Two', phone: '8765432109' },
        { id: '3', name: 'User Three', phone: '7654321098' }
      ];

      searchByPhone(searchTerm: string): { found: boolean; user?: User; error?: string } {
        if (!searchTerm) {
          return { found: false, error: 'Please enter a phone number to search' };
        }

        if (!isValidIndianMobile(searchTerm)) {
          return { found: false, error: 'Please enter a valid Indian mobile number' };
        }

        // Normalize search term
        let normalized = searchTerm.replace(/[\s\-()\.]*/g, '');
        if (normalized.startsWith('+91')) {
          normalized = normalized.substring(3);
        } else if (normalized.startsWith('91') && normalized.length === 12) {
          normalized = normalized.substring(2);
        }

        const user = this.users.find(u => u.phone === normalized);

        if (user) {
          return { found: true, user };
        }

        return { found: false, error: 'No user found with this phone number' };
      }
    }

    test('should find user with exact match', () => {
      const search = new UserSearch();
      const result = search.searchByPhone('9876543210');

      expect(result.found).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.name).toBe('User One');
    });

    test('should find user with formatted phone', () => {
      const search = new UserSearch();
      const result = search.searchByPhone('+91 98765 43210');

      expect(result.found).toBe(true);
      expect(result.user?.name).toBe('User One');
    });

    test('should not find user with invalid phone', () => {
      const search = new UserSearch();
      const result = search.searchByPhone('5876543210');

      expect(result.found).toBe(false);
      expect(result.error).toBe('Please enter a valid Indian mobile number');
      expect(result.user).toBeUndefined();
    });

    test('should not find non-existent user', () => {
      const search = new UserSearch();
      const result = search.searchByPhone('6543210987');

      expect(result.found).toBe(false);
      expect(result.error).toBe('No user found with this phone number');
    });
  });

  describe('Business Rule Compliance', () => {
    // Test specific business requirements from SCRUM-11
    describe('SCRUM-11 Requirements', () => {
      test('Requirement 1: Returns true for valid 10-digit Indian mobile', () => {
        expect(isValidIndianMobile('9876543210')).toBe(true);
        expect(isValidIndianMobile('8765432109')).toBe(true);
        expect(isValidIndianMobile('7654321098')).toBe(true);
        expect(isValidIndianMobile('6543210987')).toBe(true);
      });

      test('Requirement 2: First digit must be 6-9', () => {
        expect(isValidIndianMobile('6000000000')).toBe(true);
        expect(isValidIndianMobile('7000000000')).toBe(true);
        expect(isValidIndianMobile('8000000000')).toBe(true);
        expect(isValidIndianMobile('9000000000')).toBe(true);
        expect(isValidIndianMobile('5000000000')).toBe(false);
        expect(isValidIndianMobile('0000000000')).toBe(false);
      });

      test('Requirement 3: Strips spaces if present', () => {
        expect(isValidIndianMobile('98765 43210')).toBe(true);
        expect(isValidIndianMobile('9 8 7 6 5 4 3 2 1 0')).toBe(true);
        expect(isValidIndianMobile(' 9876543210 ')).toBe(true);
      });

      test('Requirement 4: Strips +91 if present', () => {
        expect(isValidIndianMobile('+919876543210')).toBe(true);
        expect(isValidIndianMobile('+91 9876543210')).toBe(true);
        expect(isValidIndianMobile('+91-9876543210')).toBe(true);
      });

      test('Requirement 5: TypeScript type safety', () => {
        // Type checking is done at compile time
        // This test verifies runtime behavior with various inputs
        const testCases: Array<[any, boolean]> = [
          ['9876543210', true],
          [9876543210, false], // number type
          [null, false],
          [undefined, false],
          [{}, false],
          [[], false]
        ];

        testCases.forEach(([input, expected]) => {
          expect(isValidIndianMobile(input)).toBe(expected);
        });
      });
    });
  });
});
