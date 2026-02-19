import { Database } from 'sqlite3';
import { OrderStatus } from '../repositories/order.repository';
import { RestaurantRepository } from '../repositories/restaurant.repository';
import { DishRepository } from '../repositories/dish.repository';
import { ValidationError } from '../middleware/error.middleware';
import { Cart, CartRepository } from '../repositories/cart.repository';

// Valid status transitions
const VALID_TRANSITIONS: { [key in OrderStatus]?: OrderStatus[] } = {
  'pending': ['accepted', 'rejected', 'cancelled'],
  'accepted': ['preparing', 'cancelled'],
  'preparing': ['ready', 'cancelled'],
  'ready': ['delivering', 'cancelled'],
  'delivering': ['delivered', 'cancelled'],
  'rejected': [],
  'delivered': [],
  'cancelled': []
};

export class CartService {
  private cartRepo: CartRepository;
  private restaurantRepo: RestaurantRepository;
  private dishRepo: DishRepository;

  constructor(db: Database) {
    this.cartRepo = new CartRepository(db);
    this.restaurantRepo = new RestaurantRepository(db);
    this.dishRepo = new DishRepository(db);
  }

  /**
   * Create a new order (Customer only)
   */
  async saveCart(customerId: string, cart: Cart): Promise<Cart> {
    const errors: string[] = [];

    // Validate input
    console.log('Saving customer cart: ', cart)
    if (cart.items) {
      for(let item of cart.items){
        // Check restaurant exists
        const restaurant = await this.restaurantRepo.findById(item.restaurantId);
        if (!restaurant) {
          errors.push(`Restaurant ${item.restaurantId} not found`);
          continue;
        }
        if (!item.dishId) {
          errors.push(`Item ${item}: Dish ID is required`);
        } else if(!this.dishRepo.findById(item.dishId)){
          errors.push(`Dish ${item.dishId}: is missing`);
        }
        if (!item.quantity || item.quantity < 1 || item.quantity > 99) {
          errors.push(`Item ${item}: Quantity must be between 1 and 99`);
        }
      };
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
    cart.customerId = customerId
    const savedCart = await this.cartRepo.save(cart);
    return savedCart;
  }

  /**
   * Get customer's orders
   */
  async getCart(
    customerId: string,
  ): Promise<Cart | null> {
    console.log('Loading cart for customer:', customerId)
    return this.cartRepo.findById(customerId);
  }
}
