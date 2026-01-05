import jwt, { SignOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import config from '../config/config';
import { TokenPayload } from '../types/auth.types';

export class AuthService {
  /**
   * Generate a JWT token for a user
   * @param userId User ID
   * @param role User role
   * @param restaurantId Restaurant ID (for restaurant owners)
   * @returns JWT token
   */
  generateToken(userId: string, role: 'customer' | 'restaurantOwner', restaurantId?: string | number): string {
    // Calculate expiration time (1 hour from now)
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 3600; // 1 hour in seconds
    
    const payload: any = {
      sub: userId,
      role: role,
      exp: now + expiresIn,
      iat: now
    };

    if (restaurantId !== undefined) {
      payload.restaurantId = restaurantId;
    }

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

/**
 * Express middleware to require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.substring(7);
  const payload = authService.verifyToken(token);

  if (!payload) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }

  // Attach user info to request
  (req as any).user = payload;
  next();
}
