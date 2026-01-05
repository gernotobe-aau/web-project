import argon2 from 'argon2';

export class PasswordService {
  /**
   * Hash a password using Argon2id
   * @param password Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4
    });
  }

  /**
   * Verify a password against a hash
   * @param password Plain text password
   * @param hash Hashed password
   * @returns True if password matches
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      return false;
    }
  }
}

export const passwordService = new PasswordService();
