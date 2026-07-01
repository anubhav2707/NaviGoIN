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
 * @param phone - The phone string to validate
 * @returns true if the phone is valid, false otherwise
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  return phone.length >= 10 && phoneRegex.test(phone);
}

/**
 * Validates if a string is a valid Indian PIN code
 * @param pincode - The pincode string to validate
 * @returns true if the pincode is valid, false otherwise
 */
export function isValidIndianPincode(pincode: string): boolean {
  // Indian PIN codes must be exactly 6 digits and cannot start with 0
  const pincodeRegex = /^[1-9]\d{5}$/;
  return pincodeRegex.test(pincode);
}