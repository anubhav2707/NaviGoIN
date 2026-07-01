import * as validators from './validators';
import * as utilsExports from './index';

describe('Validators Integration Tests', () => {
  describe('Module exports', () => {
    it('should export isValidIndianPincode from validators module', () => {
      expect(validators.isValidIndianPincode).toBeDefined();
      expect(typeof validators.isValidIndianPincode).toBe('function');
    });

    it('should export isValidIndianPincode from utils index', () => {
      expect(utilsExports.isValidIndianPincode).toBeDefined();
      expect(typeof utilsExports.isValidIndianPincode).toBe('function');
    });

    it('should have the same function reference in both exports', () => {
      expect(utilsExports.isValidIndianPincode).toBe(validators.isValidIndianPincode);
    });
  });

  describe('Integration with other components', () => {
    it('should work correctly when imported from index', () => {
      const { isValidIndianPincode } = utilsExports;
      
      // Valid cases
      expect(isValidIndianPincode('560001')).toBe(true);
      expect(isValidIndianPincode('110001')).toBe(true);
      expect(isValidIndianPincode('400001')).toBe(true);
      
      // Invalid cases
      expect(isValidIndianPincode('012345')).toBe(false);
      expect(isValidIndianPincode('12345')).toBe(false);
      expect(isValidIndianPincode('')).toBe(false);
    });

    it('should handle batch validation scenarios', () => {
      const pincodes = [
        '560001',
        '110001',
        '012345',
        '12345',
        '1234567',
        '56a001',
        '',
        '400001',
        '700001',
        '000000'
      ];

      const results = pincodes.map(validators.isValidIndianPincode);
      
      expect(results).toEqual([
        true,  // 560001
        true,  // 110001
        false, // 012345
        false, // 12345
        false, // 1234567
        false, // 56a001
        false, // empty
        true,  // 400001
        true,  // 700001
        false  // 000000
      ]);
    });

    it('should work with filter operations', () => {
      const addresses = [
        { city: 'Bangalore', pincode: '560001' },
        { city: 'Delhi', pincode: '110001' },
        { city: 'Invalid1', pincode: '012345' },
        { city: 'Invalid2', pincode: '12345' },
        { city: 'Mumbai', pincode: '400001' },
        { city: 'Invalid3', pincode: 'abc123' }
      ];

      const validAddresses = addresses.filter(addr => 
        validators.isValidIndianPincode(addr.pincode)
      );

      expect(validAddresses).toHaveLength(3);
      expect(validAddresses.map(a => a.city)).toEqual(['Bangalore', 'Delhi', 'Mumbai']);
    });

    it('should handle concurrent validations', async () => {
      const validateAsync = (pincode: string): Promise<boolean> => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(validators.isValidIndianPincode(pincode));
          }, 0);
        });
      };

      const results = await Promise.all([
        validateAsync('560001'),
        validateAsync('110001'),
        validateAsync('012345'),
        validateAsync('12345'),
        validateAsync('1234567')
      ]);

      expect(results).toEqual([true, true, false, false, false]);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should not throw errors for any string input', () => {
      const testCases = [
        '',
        '1',
        '123456789',
        'abcdefghijk',
        '!@#$%^&*()',
        '\n\t\r',
        '   ',
        'null',
        'undefined',
        'NaN',
        'Infinity'
      ];

      testCases.forEach(testCase => {
        expect(() => validators.isValidIndianPincode(testCase)).not.toThrow();
      });
    });

    it('should handle unicode characters correctly', () => {
      expect(validators.isValidIndianPincode('५६०००१')).toBe(false); // Hindi numerals
      expect(validators.isValidIndianPincode('٥٦٠٠٠١')).toBe(false); // Arabic numerals
      expect(validators.isValidIndianPincode('🔢🔢🔢🔢🔢🔢')).toBe(false); // Emoji
    });

    it('should maintain consistent behavior across multiple calls', () => {
      const pincode = '560001';
      const results = [];
      
      for (let i = 0; i < 100; i++) {
        results.push(validators.isValidIndianPincode(pincode));
      }
      
      expect(results.every(r => r === true)).toBe(true);
    });
  });

  describe('Performance characteristics', () => {
    it('should validate large number of pincodes efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 10000; i++) {
        validators.isValidIndianPincode('560001');
        validators.isValidIndianPincode('012345');
        validators.isValidIndianPincode('12345');
        validators.isValidIndianPincode('56a001');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete 40,000 validations in less than 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});
