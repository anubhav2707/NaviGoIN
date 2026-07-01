/**
 * Validates that input contains only numeric digits
 * @param input - The string to validate
 * @returns true if valid, false otherwise
 */
export function validateNumericInput(input: string): boolean {
  // Reject empty strings
  if (!input || input.length === 0) {
    return false;
  }

  // Reject inputs containing non-digit characters
  // This will catch cases like '98765-43210', '123.45', '12a34', etc.
  if (!/^\d+$/.test(input)) {
    return false;
  }

  return true;
}

/**
 * Validates phone number format
 * @param phoneNumber - The phone number to validate
 * @returns true if valid, false otherwise
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // Must be exactly 10 digits, no other characters allowed
  return /^\d{10}$/.test(phoneNumber);
}

/**
 * Validates Indian PIN (Postal Index Number) code format
 * @param pincode - The PIN code to validate
 * @returns true if valid, false otherwise
 */
export function isValidIndianPincode(pincode: string): boolean {
  // Must be exactly 6 digits and must not start with 0
  // (Indian PIN codes always begin with a digit from 1-9)
  return /^[1-9]\d{5}$/.test(pincode);
}
