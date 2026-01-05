import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../../db/init';
import { CustomerRegistrationService, ValidationException } from '../../business/customer-registration.service';
import { RestaurantOwnerRegistrationService } from '../../business/restaurant-owner-registration.service';
import { LoginService, UnauthorizedException } from '../../business/login.service';

export class AuthController {
  /**
   * POST /api/auth/register/customer
   * Register a new customer
   */
  async registerCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const db = getDatabase();
      const service = new CustomerRegistrationService(db);

      const result = await service.registerCustomer(req.body);

      res.status(201).json({
        message: 'Customer registered successfully',
        userId: result.customerId,
        role: 'customer',
        accessToken: result.accessToken
      });
    } catch (error) {
      if (error instanceof ValidationException) {
        res.status(422).json({
          error: 'Validation failed',
          details: error.errors
        });
      } else {
        next(error);
      }
    }
  }

  /**
   * POST /api/auth/register/restaurant-owner
   * Register a new restaurant owner with their restaurant
   */
  async registerRestaurantOwner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('[RestaurantOwnerRegistration] Request body:', JSON.stringify(req.body, null, 2));
      
      const db = getDatabase();
      const service = new RestaurantOwnerRegistrationService(db);

      const result = await service.registerRestaurantOwner(req.body);

      res.status(201).json({
        message: 'Restaurant owner registered successfully',
        userId: result.ownerId,
        restaurantId: result.restaurantId,
        role: 'restaurantOwner',
        accessToken: result.accessToken
      });
    } catch (error) {
      if (error instanceof ValidationException) {
        console.log('[RestaurantOwnerRegistration] Validation errors:', JSON.stringify(error.errors, null, 2));
        res.status(422).json({
          error: 'Validation failed',
          details: error.errors
        });
      } else {
        next(error);
      }
    }
  }

  /**
   * POST /api/auth/login
   * Login for both customers and restaurant owners
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      console.log('[Login] Attempt for email:', email);

      if (!email || !password) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Email and password are required'
        });
        return;
      }

      const db = getDatabase();
      const service = new LoginService(db);

      const result = await service.login({ email, password });

      console.log('[Login] Success for user:', result.user.email, 'Role:', result.user.role);

      res.status(200).json({
        accessToken: result.accessToken,
        user: result.user
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      } else {
        next(error);
      }
    }
  }
}

export const authController = new AuthController();
