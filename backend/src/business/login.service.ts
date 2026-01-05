import { Database } from 'sqlite3';
import { CustomerRepository } from '../repositories/customer.repository';
import { RestaurantOwnerRepository } from '../repositories/restaurant-owner.repository';
import { RestaurantRepository } from '../repositories/restaurant.repository';
import { passwordService } from './password.service';
import { authService } from '../middleware/auth.middleware';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'customer' | 'restaurantOwner';
    restaurantId?: string;
  };
}

export class LoginService {
  private customerRepository: CustomerRepository;
  private ownerRepository: RestaurantOwnerRepository;
  private restaurantRepository: RestaurantRepository;

  constructor(db: Database) {
    this.customerRepository = new CustomerRepository(db);
    this.ownerRepository = new RestaurantOwnerRepository(db);
    this.restaurantRepository = new RestaurantRepository(db);
  }

  /**
   * Authenticate user (customer or restaurant owner) and return JWT token
   */
  async login(input: LoginInput): Promise<LoginResponse> {
    // Validate input
    if (!input.email || !input.password) {
      throw new UnauthorizedException();
    }

    // Try to find customer first
    const customer = await this.customerRepository.findByEmailWithPassword(input.email);
    if (customer) {
      // Verify password
      const isValid = await passwordService.verifyPassword(input.password, customer.passwordHash);
      if (!isValid) {
        throw new UnauthorizedException();
      }

      // Generate token
      const accessToken = authService.generateToken(customer.id, 'customer');

      return {
        accessToken,
        user: {
          id: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          role: 'customer'
        }
      };
    }

    // Try to find restaurant owner
    const owner = await this.ownerRepository.findByEmailWithPassword(input.email);
    if (owner) {
      // Verify password
      const isValid = await passwordService.verifyPassword(input.password, owner.passwordHash);
      if (!isValid) {
        throw new UnauthorizedException();
      }

      // Get owner's restaurant
      const restaurants = await this.restaurantRepository.findByOwnerId(owner.id);
      const restaurantId = restaurants.length > 0 ? restaurants[0].id : undefined;

      // Generate token
      const accessToken = authService.generateToken(owner.id, 'restaurantOwner', restaurantId);

      return {
        accessToken,
        user: {
          id: owner.id,
          email: owner.email,
          firstName: owner.firstName,
          lastName: owner.lastName,
          role: 'restaurantOwner',
          restaurantId
        }
      };
    }

    // Neither customer nor owner found, or password incorrect
    throw new UnauthorizedException();
  }
}

export class UnauthorizedException extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'UnauthorizedException';
  }
}
