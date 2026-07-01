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
 * Validates if a string is a valid Indian mobile number
 * @param phone - The phone number string to validate
 * @returns true if the phone number is valid, false otherwise
 */
export function isValidIndianMobile(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * Validates if a string is a valid Indian PIN code
 * @param pincode - The PIN code string to validate
 * @returns true if the PIN code is valid, false otherwise
 */
export function isValidIndianPincode(pincode: string): boolean {
  // Indian PIN codes are exactly 6 digits and start with 1-9 (never 0)
  const pincodeRegex = /^[1-9]\d{5}$/;
  return pincodeRegex.test(pincode);
}

/**
 * Validates if a string is a valid OTP
 * @param otp - The OTP string to validate
 * @returns true if the OTP is valid, false otherwise
 */
export function isValidOTP(otp: string): boolean {
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
}

/**
 * Validates if a string is a valid URL
 * @param url - The URL string to validate
 * @returns true if the URL is valid, false otherwise
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates if a string is a valid UPI ID
 * @param upiId - The UPI ID string to validate
 * @returns true if the UPI ID is valid, false otherwise
 */
export function isValidUPI(upiId: string): boolean {
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  return upiRegex.test(upiId);
}

/**
 * Validates if a string is a valid vehicle registration number
 * @param regNumber - The vehicle registration number to validate
 * @returns true if the registration number is valid, false otherwise
 */
export function isValidVehicleRegistration(regNumber: string): boolean {
  const regRegex = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/;
  return regRegex.test(regNumber);
}