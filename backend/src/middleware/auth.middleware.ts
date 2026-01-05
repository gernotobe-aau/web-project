import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config/config';
import { TokenPayload } from '../types/auth.types';

export class AuthService {
  /**
   * Generate a JWT token for a user
   * @param userId User ID
   * @param role User role
   * @returns JWT token
   */
  generateToken(userId: string, role: 'customer' | 'restaurantOwner'): string {
    const payload = {
      sub: userId,
      role: role
    };

    return jwt.sign(payload, config.jwtSecret);
  }

  /**
   * Verify and decode a JWT token
   * @param token JWT token
   * @returns Decoded token payload or null if invalid
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();
