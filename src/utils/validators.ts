/**
 * Validates if a string is a valid Indian PIN code
 * @param pincode - The PIN code string to validate
 * @returns True if the PIN code is valid, false otherwise
 */
export function isValidIndianPincode(pincode: string): boolean {
  // Check if pincode is empty
  if (!pincode || pincode.length === 0) {
    return false;
  }

  // Check if pincode is exactly 6 characters
  if (pincode.length !== 6) {
    return false;
  }

  // Check if all characters are digits
  if (!/^\d+$/.test(pincode)) {
    return false;
  }

  // Check if first digit is between 1-9 (not 0)
  const firstDigit = parseInt(pincode[0], 10);
  if (firstDigit === 0) {
    return false;
  }

  return true;
}
