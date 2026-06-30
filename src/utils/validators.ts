/**
 * Validators module for phone number validation
 */

/**
 * Validates Indian mobile phone numbers.
 * 
 * Valid Indian mobile numbers:
 * - 10 digits only (after removing country code and formatting)
 * - First digit must be 6, 7, 8, or 9
 * - Can have +91 country code prefix
 * - Can have spaces or hyphens as separators
 * 
 * @param phone - The phone number string to validate
 * @returns true if valid Indian mobile number, false otherwise
 * 
 * @example
 * isValidIndianMobile('9876543210') // true
 * isValidIndianMobile('+919876543210') // true
 * isValidIndianMobile('+91 98765 43210') // true
 * isValidIndianMobile('5876543210') // false (starts with 5)
 * isValidIndianMobile('98765432') // false (too short)
 */
export function isValidIndianMobile(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Remove all whitespace, hyphens, parentheses, and dots
  let cleaned = phone.replace(/[\s\-()\.]*/g, '');

  // Remove country code prefix if present
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    // Handle 91XXXXXXXXXX format
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0091')) {
    // Handle 0091XXXXXXXXXX format
    cleaned = cleaned.substring(4);
  }

  // Must be exactly 10 digits
  if (cleaned.length !== 10) {
    return false;
  }

  // Must contain only digits
  if (!/^\d+$/.test(cleaned)) {
    return false;
  }

  // First digit must be 6, 7, 8, or 9
  const firstDigit = parseInt(cleaned[0], 10);
  if (firstDigit < 6 || firstDigit > 9) {
    return false;
  }

  return true;
}
