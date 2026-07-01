import { isValidIndianPincode } from '../index';

/**
 * Functional / e2e test for the ticket's business requirement: an Indian PIN
 * code must be validated before an address can be saved. This exercises the
 * validator through a minimal address-entry flow that mirrors how the app
 * gates a saved address on the public utils API.
 */
interface AddressForm {
  line1: string;
  city: string;
  pincode: string;
}

interface SubmitResult {
  ok: boolean;
  error?: string;
}

function submitAddress(form: AddressForm): SubmitResult {
  if (!isValidIndianPincode(form.pincode)) {
    return { ok: false, error: 'Please enter a valid 6-digit PIN code' };
  }
  return { ok: true };
}

describe('isValidIndianPincode (e2e / functional)', () => {
  it('accepts an address with a valid Indian PIN code', () => {
    const result = submitAddress({
      line1: '12 MG Road',
      city: 'Bengaluru',
      pincode: '560001',
    });

    expect(result).toEqual({ ok: true });
  });

  it('accepts a New Delhi address PIN code', () => {
    const result = submitAddress({
      line1: 'Connaught Place',
      city: 'New Delhi',
      pincode: '110001',
    });

    expect(result.ok).toBe(true);
  });

  it('rejects an address whose PIN code starts with 0', () => {
    const result = submitAddress({
      line1: 'Somewhere',
      city: 'Nowhere',
      pincode: '012345',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Please enter a valid 6-digit PIN code');
  });

  it('rejects an address with a malformed PIN code', () => {
    const badPincodes = ['12345', '1234567', '56a001', ''];

    for (const pincode of badPincodes) {
      const result = submitAddress({ line1: 'x', city: 'y', pincode });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Please enter a valid 6-digit PIN code');
    }
  });
});
