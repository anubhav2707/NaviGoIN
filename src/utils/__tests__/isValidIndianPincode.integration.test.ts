import * as utils from '../index';
import { isValidIndianPincode } from '../index';
import { isValidIndianPincode as isValidIndianPincodeDirect } from '../validators';

/**
 * Integration tests: verify the validator is correctly wired through the
 * public `src/utils` barrel and behaves identically to the direct import.
 */
describe('isValidIndianPincode (integration)', () => {
  it('is re-exported from the utils barrel', () => {
    expect(typeof utils.isValidIndianPincode).toBe('function');
  });

  it('resolves to the same implementation as the direct module export', () => {
    expect(utils.isValidIndianPincode).toBe(isValidIndianPincodeDirect);
  });

  it('behaves identically whether imported via the barrel or directly', () => {
    const samples = [
      '560001',
      '110001',
      '012345',
      '12345',
      '1234567',
      '56a001',
      '',
    ];

    for (const sample of samples) {
      expect(isValidIndianPincode(sample)).toBe(isValidIndianPincodeDirect(sample));
    }
  });

  it('validates representative pincodes through the public API', () => {
    expect(isValidIndianPincode('400001')).toBe(true);
    expect(isValidIndianPincode('000000')).toBe(false);
  });
});
