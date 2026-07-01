import { isValidIndianPincode, isValidEmail, isValidPhone } from '../validators';

describe('Validators E2E Tests - Business Requirements', () => {
  describe('SCRUM-20: Indian Pincode Validator', () => {
    describe('Acceptance Criteria Verification', () => {
      it('should validate pincode 560001 as true', () => {
        expect(isValidIndianPincode('560001')).toBe(true);
      });

      it('should validate pincode 110001 as true', () => {
        expect(isValidIndianPincode('110001')).toBe(true);
      });

      it('should validate pincode 012345 as false (starts with 0)', () => {
        expect(isValidIndianPincode('012345')).toBe(false);
      });

      it('should validate pincode 12345 as false (too short)', () => {
        expect(isValidIndianPincode('12345')).toBe(false);
      });

      it('should validate pincode 1234567 as false (too long)', () => {
        expect(isValidIndianPincode('1234567')).toBe(false);
      });

      it('should validate pincode 56a001 as false (non-digit)', () => {
        expect(isValidIndianPincode('56a001')).toBe(false);
      });

      it('should validate empty string as false', () => {
        expect(isValidIndianPincode('')).toBe(false);
      });
    });

    describe('Real-world User Scenarios', () => {
      describe('User Registration Flow', () => {
        interface RegistrationForm {
          name: string;
          email: string;
          phone: string;
          pincode: string;
        }

        function validateRegistration(form: RegistrationForm): {
          valid: boolean;
          errors: string[];
        } {
          const errors: string[] = [];
          
          if (!form.name || form.name.length < 2) {
            errors.push('Name is required and must be at least 2 characters');
          }
          
          if (!isValidEmail(form.email)) {
            errors.push('Invalid email address');
          }
          
          if (!isValidPhone(form.phone)) {
            errors.push('Invalid phone number');
          }
          
          if (!isValidIndianPincode(form.pincode)) {
            errors.push('Invalid Indian PIN code');
          }
          
          return {
            valid: errors.length === 0,
            errors
          };
        }

        it('should accept valid registration form', () => {
          const form: RegistrationForm = {
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '9876543210',
            pincode: '560001'
          };

          const result = validateRegistration(form);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        });

        it('should reject form with invalid pincode starting with 0', () => {
          const form: RegistrationForm = {
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '9876543210',
            pincode: '012345'
          };

          const result = validateRegistration(form);
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Invalid Indian PIN code');
        });

        it('should reject form with short pincode', () => {
          const form: RegistrationForm = {
            name: 'Jane Doe',
            email: 'jane.doe@example.com',
            phone: '9876543210',
            pincode: '56000'
          };

          const result = validateRegistration(form);
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Invalid Indian PIN code');
        });

        it('should provide multiple error messages for multiple invalid fields', () => {
          const form: RegistrationForm = {
            name: 'J',
            email: 'invalid-email',
            phone: '123',
            pincode: '56a001'
          };

          const result = validateRegistration(form);
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(1);
          expect(result.errors).toContain('Invalid Indian PIN code');
        });
      });

      describe('Address Validation for Delivery', () => {
        interface DeliveryAddress {
          street: string;
          city: string;
          state: string;
          pincode: string;
        }

        function isDeliverable(address: DeliveryAddress): boolean {
          // Check if pincode is valid and other required fields are present
          return (
            address.street.length > 0 &&
            address.city.length > 0 &&
            address.state.length > 0 &&
            isValidIndianPincode(address.pincode)
          );
        }

        const deliveryTestCases: Array<{
          description: string;
          address: DeliveryAddress;
          expected: boolean;
        }> = [
          {
            description: 'Valid Bangalore address',
            address: {
              street: '123 MG Road',
              city: 'Bangalore',
              state: 'Karnataka',
              pincode: '560001'
            },
            expected: true
          },
          {
            description: 'Valid Delhi address',
            address: {
              street: '456 Connaught Place',
              city: 'New Delhi',
              state: 'Delhi',
              pincode: '110001'
            },
            expected: true
          },
          {
            description: 'Invalid address with wrong pincode format',
            address: {
              street: '789 Park Street',
              city: 'Kolkata',
              state: 'West Bengal',
              pincode: '012345'
            },
            expected: false
          },
          {
            description: 'Invalid address with short pincode',
            address: {
              street: '321 Marine Drive',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '40000'
            },
            expected: false
          },
          {
            description: 'Invalid address with alphanumeric pincode',
            address: {
              street: '654 Anna Salai',
              city: 'Chennai',
              state: 'Tamil Nadu',
              pincode: '60000A'
            },
            expected: false
          }
        ];

        deliveryTestCases.forEach(({ description, address, expected }) => {
          it(`should ${expected ? 'accept' : 'reject'}: ${description}`, () => {
            expect(isDeliverable(address)).toBe(expected);
          });
        });
      });

      describe('Bulk Import Validation', () => {
        interface ImportRecord {
          id: number;
          name: string;
          pincode: string;
        }

        function validateBulkImport(records: ImportRecord[]): {
          valid: ImportRecord[];
          invalid: Array<{ record: ImportRecord; reason: string }>;
        } {
          const valid: ImportRecord[] = [];
          const invalid: Array<{ record: ImportRecord; reason: string }> = [];

          records.forEach(record => {
            if (!record.name) {
              invalid.push({ record, reason: 'Missing name' });
            } else if (!isValidIndianPincode(record.pincode)) {
              invalid.push({ record, reason: 'Invalid pincode' });
            } else {
              valid.push(record);
            }
          });

          return { valid, invalid };
        }

        it('should correctly separate valid and invalid records', () => {
          const records: ImportRecord[] = [
            { id: 1, name: 'Customer 1', pincode: '560001' },
            { id: 2, name: 'Customer 2', pincode: '012345' }, // Invalid: starts with 0
            { id: 3, name: 'Customer 3', pincode: '110001' },
            { id: 4, name: 'Customer 4', pincode: '12345' },  // Invalid: too short
            { id: 5, name: 'Customer 5', pincode: '400001' },
            { id: 6, name: 'Customer 6', pincode: '56a001' }, // Invalid: non-digit
            { id: 7, name: '', pincode: '700001' },           // Invalid: no name
            { id: 8, name: 'Customer 8', pincode: '' },       // Invalid: empty pincode
          ];

          const result = validateBulkImport(records);

          expect(result.valid).toHaveLength(3);
          expect(result.valid.map(r => r.id)).toEqual([1, 3, 5]);
          
          expect(result.invalid).toHaveLength(5);
          expect(result.invalid.find(i => i.record.id === 2)?.reason).toBe('Invalid pincode');
          expect(result.invalid.find(i => i.record.id === 4)?.reason).toBe('Invalid pincode');
          expect(result.invalid.find(i => i.record.id === 6)?.reason).toBe('Invalid pincode');
          expect(result.invalid.find(i => i.record.id === 7)?.reason).toBe('Missing name');
          expect(result.invalid.find(i => i.record.id === 8)?.reason).toBe('Invalid pincode');
        });

        it('should handle large datasets efficiently', () => {
          const largeDataset: ImportRecord[] = [];
          
          // Generate 10000 records with mix of valid and invalid pincodes
          for (let i = 0; i < 10000; i++) {
            const isValid = i % 3 !== 0; // Every 3rd record is invalid
            largeDataset.push({
              id: i,
              name: `Customer ${i}`,
              pincode: isValid ? '560001' : '012345'
            });
          }

          const startTime = Date.now();
          const result = validateBulkImport(largeDataset);
          const endTime = Date.now();

          expect(result.valid.length + result.invalid.length).toBe(10000);
          expect(result.valid.length).toBeGreaterThan(6000);
          expect(result.invalid.length).toBeGreaterThan(3000);
          expect(endTime - startTime).toBeLessThan(500); // Should process 10k records in < 500ms
        });
      });

      describe('API Input Validation', () => {
        interface APIRequest {
          method: string;
          endpoint: string;
          body?: any;
        }

        function validateAPIInput(request: APIRequest): {
          success: boolean;
          errors: string[];
        } {
          const errors: string[] = [];

          if (request.endpoint === '/api/address' && request.method === 'POST') {
            const { pincode } = request.body || {};
            
            if (!pincode) {
              errors.push('Pincode is required');
            } else if (!isValidIndianPincode(pincode)) {
              errors.push('Invalid Indian PIN code format');
            }
          }

          return {
            success: errors.length === 0,
            errors
          };
        }

        it('should validate API requests with valid pincode', () => {
          const request: APIRequest = {
            method: 'POST',
            endpoint: '/api/address',
            body: {
              street: '123 Test Street',
              pincode: '560001'
            }
          };

          const result = validateAPIInput(request);
          expect(result.success).toBe(true);
          expect(result.errors).toHaveLength(0);
        });

        it('should reject API requests with invalid pincode formats', () => {
          const invalidRequests: APIRequest[] = [
            {
              method: 'POST',
              endpoint: '/api/address',
              body: { pincode: '012345' }
            },
            {
              method: 'POST',
              endpoint: '/api/address',
              body: { pincode: '12345' }
            },
            {
              method: 'POST',
              endpoint: '/api/address',
              body: { pincode: '56a001' }
            },
            {
              method: 'POST',
              endpoint: '/api/address',
              body: { pincode: '' }
            },
            {
              method: 'POST',
              endpoint: '/api/address',
              body: {}
            }
          ];

          invalidRequests.forEach(request => {
            const result = validateAPIInput(request);
            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
          });
        });
      });
    });

    describe('Performance Requirements', () => {
      it('should validate single pincode in less than 1ms', () => {
        const iterations = 1000;
        const startTime = performance.now();
        
        for (let i = 0; i < iterations; i++) {
          isValidIndianPincode('560001');
        }
        
        const endTime = performance.now();
        const avgTime = (endTime - startTime) / iterations;
        
        expect(avgTime).toBeLessThan(1);
      });

      it('should handle concurrent validations', () => {
        const promises = [];
        
        for (let i = 0; i < 100; i++) {
          promises.push(
            Promise.resolve(isValidIndianPincode('560001')),
            Promise.resolve(isValidIndianPincode('012345'))
          );
        }
        
        return Promise.all(promises).then(results => {
          expect(results.filter(r => r === true).length).toBe(100);
          expect(results.filter(r => r === false).length).toBe(100);
        });
      });
    });

    describe('Regression Tests', () => {
      it('should not affect existing email validator', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('invalid')).toBe(false);
      });

      it('should not affect existing phone validator', () => {
        expect(isValidPhone('9876543210')).toBe(true);
        expect(isValidPhone('123')).toBe(false);
      });

      it('should maintain backward compatibility', () => {
        // Test that the function signature hasn't changed
        expect(isValidIndianPincode.length).toBe(1); // Expects 1 parameter
        expect(typeof isValidIndianPincode('560001')).toBe('boolean');
      });
    });
  });
});