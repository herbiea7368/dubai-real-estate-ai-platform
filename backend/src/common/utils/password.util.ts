import * as bcrypt from 'bcrypt';

/**
 * Password Utility Functions
 *
 * Provides secure password hashing and comparison using bcrypt
 * with industry-standard cost factor for UAE market security requirements
 */

// Cost factor for bcrypt (12 = ~250ms per hash on modern hardware)
const SALT_ROUNDS = 12;

/**
 * Password complexity requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Hash a plaintext password using bcrypt
 *
 * @param password - The plaintext password to hash
 * @returns Promise resolving to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plaintext password with a hashed password
 *
 * @param plainPassword - The plaintext password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns Promise resolving to true if passwords match, false otherwise
 */
export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Validate password complexity
 *
 * @param password - The password to validate
 * @returns true if password meets complexity requirements
 */
export function validatePasswordComplexity(password: string): boolean {
  return PASSWORD_COMPLEXITY_REGEX.test(password);
}
