/**
 * Validates if a string is a valid email address
 * @param email - The email string to validate
 * @returns true if the email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates if a string is a valid phone number
 * @param phone - The phone number string to validate
 * @returns true if the phone number is valid, false otherwise
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\d\s\-+()]+$/;
  return phone.length >= 10 && phoneRegex.test(phone);
}

/**
 * Validates if a string is a valid Indian PIN code
 * @param pincode - The PIN code string to validate
 * @returns true if the PIN code is valid, false otherwise
 */
export function isValidIndianPincode(pincode: string): boolean {
  // Indian PIN codes are exactly 6 digits and cannot start with 0
  const pincodeRegex = /^[1-9]\d{5}$/;
  return pincodeRegex.test(pincode);
}
