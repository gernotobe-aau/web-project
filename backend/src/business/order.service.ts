import { Database } from 'sqlite3';
import { OrderRepository, Order, CreateOrderData, OrderStatus, OrderWithRestaurant, OrderWithCustomer } from '../repositories/order.repository';
import { OrderItemRepository, CreateOrderItemData } from '../repositories/order-item.repository';
import { OrderStatusHistoryRepository } from '../repositories/order-status-history.repository';
import { VoucherRepository } from '../repositories/voucher.repository';
import { RestaurantRepository } from '../repositories/restaurant.repository';
import { DishRepository } from '../repositories/dish.repository';
import { CustomerRepository } from '../repositories/customer.repository';
import { ValidationError, ConflictError, NotFoundError, AuthorizationError } from '../middleware/error.middleware';

interface CreateOrderRequest {
  restaurantId: string;
  items: { dishId: number; quantity: number }[];
  voucherCode?: string;
  customerNotes?: string;
}

interface OrderWithItems extends Order {
  items: any[];
  statusHistory?: any[];
}

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

export class OrderService {
  private orderRepo: OrderRepository;
  private orderItemRepo: OrderItemRepository;
  private statusHistoryRepo: OrderStatusHistoryRepository;
  private voucherRepo: VoucherRepository;
  private restaurantRepo: RestaurantRepository;
  private dishRepo: DishRepository;
  private customerRepo: CustomerRepository;

  constructor(db: Database) {
    this.orderRepo = new OrderRepository(db);
    this.orderItemRepo = new OrderItemRepository(db);
    this.statusHistoryRepo = new OrderStatusHistoryRepository(db);
    this.voucherRepo = new VoucherRepository(db);
    this.restaurantRepo = new RestaurantRepository(db);
    this.dishRepo = new DishRepository(db);
    this.customerRepo = new CustomerRepository(db);
  }

  /**
   * Create a new order (Customer only)
   */
  async createOrder(customerId: string, orderRequest: CreateOrderRequest): Promise<OrderWithItems> {
    const errors: string[] = [];

    // Validate input
    if (!orderRequest.restaurantId) {
      errors.push('Restaurant ID is required');
    }

    if (!orderRequest.items || orderRequest.items.length === 0) {
      errors.push('At least one item is required');
    }

    if (orderRequest.items) {
      orderRequest.items.forEach((item, index) => {
        if (!item.dishId) {
          errors.push(`Item ${index + 1}: Dish ID is required`);
        }
        if (!item.quantity || item.quantity < 1 || item.quantity > 99) {
          errors.push(`Item ${index + 1}: Quantity must be between 1 and 99`);
        }
      });
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    // Check restaurant exists
    const restaurant = await this.restaurantRepo.findById(orderRequest.restaurantId);
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    // Check if restaurant is open
    const isOpen = await this.isRestaurantOpen(orderRequest.restaurantId);
    if (!isOpen) {
      throw new ConflictError('Restaurant is closed');
    }

    // Check all dishes exist and belong to the restaurant
    const dishes = await Promise.all(
      orderRequest.items.map(item => this.dishRepo.findById(item.dishId))
    );

    dishes.forEach((dish, index) => {
      if (!dish) {
        errors.push(`Dish with ID ${orderRequest.items[index].dishId} not found`);
      } else if (dish.restaurant_id !== orderRequest.restaurantId) {
        errors.push(`All dishes must belong to the same restaurant`);
      }
    });

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    // Calculate subtotal
    let subtotal = 0;
    dishes.forEach((dish, index) => {
      if (dish) {
        subtotal += dish.price * orderRequest.items[index].quantity;
      }
    });
    subtotal = Math.round(subtotal * 100) / 100;

    // Validate and apply voucher if provided
    let discountAmount = 0;
    let voucherId: number | undefined;
    let voucherCode: string | undefined;

    if (orderRequest.voucherCode) {
      const voucherValidation = await this.voucherRepo.isValid(
        orderRequest.voucherCode,
        orderRequest.restaurantId
      );

      if (!voucherValidation.valid || !voucherValidation.voucher) {
        throw new ConflictError(voucherValidation.message || 'Invalid voucher');
      }

      voucherId = voucherValidation.voucher.id;
      voucherCode = voucherValidation.voucher.code;
      discountAmount = this.voucherRepo.calculateDiscount(voucherValidation.voucher, subtotal);
      discountAmount = Math.round(discountAmount * 100) / 100;
    }

    const finalPrice = Math.round((subtotal - discountAmount) * 100) / 100;

    // Get customer delivery address
    const customer = await this.customerRepo.findById(customerId);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Calculate estimated delivery time
    const estimatedDeliveryMinutes = await this.calculateEstimatedDelivery(
      orderRequest.items.map((item, index) => dishes[index]!)
    );

    // Create order
    const orderData: CreateOrderData = {
      customerId,
      restaurantId: orderRequest.restaurantId,
      subtotal,
      discountAmount,
      finalPrice,
      voucherId,
      voucherCode,
      deliveryAddress: {
        street: customer.deliveryStreet,
        houseNumber: customer.deliveryHouseNumber,
        staircase: customer.deliveryStaircase,
        door: customer.deliveryDoor,
        postalCode: customer.deliveryPostalCode,
        city: customer.deliveryCity
      },
      estimatedDeliveryMinutes,
      customerNotes: orderRequest.customerNotes
    };

    const order = await this.orderRepo.create(orderData);

    // Create order items
    const orderItems: CreateOrderItemData[] = orderRequest.items.map((item, index) => ({
      orderId: order.id,
      dishId: item.dishId,
      dishName: dishes[index]!.name,
      dishPrice: dishes[index]!.price,
      quantity: item.quantity
    }));

    await this.orderItemRepo.createBatch(orderItems);

    // Create initial status history entry
    await this.statusHistoryRepo.create(order.id, 'pending');

    // Increment voucher usage count if voucher was used
    if (voucherId) {
      await this.voucherRepo.incrementUsageCount(voucherId);
    }

    // Return order with items
    const items = await this.orderItemRepo.findByOrderId(order.id);
    return { ...order, items };
  }

  /**
   * Get customer's orders
   */
  async getCustomerOrders(
    customerId: string,
    filters?: {
      status?: OrderStatus;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<OrderWithRestaurant[]> {
    return this.orderRepo.findByCustomerId(customerId, filters);
  }

  /**
   * Get order details by ID (with items and history)
   */
  async getOrderDetails(orderId: string, userId: string, userRole: 'customer' | 'restaurant_owner'): Promise<OrderWithItems> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check authorization
    if (userRole === 'customer') {
      const belongsToCustomer = await this.orderRepo.checkOrderBelongsToCustomer(orderId, userId);
      if (!belongsToCustomer) {
        throw new AuthorizationError('You do not have permission to view this order');
      }
    } else if (userRole === 'restaurant_owner') {
      // Get restaurant ID for the owner
      const restaurants = await this.restaurantRepo.findByOwnerId(userId);
      const belongsToOwner = restaurants.some(r => r.id === order.restaurantId);
      if (!belongsToOwner) {
        throw new AuthorizationError('You do not have permission to view this order');
      }
    }

    const items = await this.orderItemRepo.findByOrderId(orderId);
    const statusHistory = await this.statusHistoryRepo.findByOrderId(orderId);

    return { ...order, items, statusHistory };
  }

  /**
   * Get restaurant's orders
   */
  async getRestaurantOrders(
    restaurantId: string,
    ownerId: string,
    filters?: {
      status?: OrderStatus;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<OrderWithCustomer[]> {
    // Check authorization: owner must own the restaurant
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    if (restaurant.ownerId !== ownerId) {
      throw new AuthorizationError('You do not have permission to view orders for this restaurant');
    }

    return this.orderRepo.findByRestaurantId(restaurantId, filters);
  }

  /**
   * Accept order (Restaurant Owner only)
   */
  async acceptOrder(orderId: string, ownerId: string): Promise<Order> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check authorization
    await this.checkOwnerAuthorization(order.restaurantId, ownerId);

    // Check if order is in pending status
    if (order.orderStatus !== 'pending') {
      throw new ConflictError('Order is not in pending status');
    }

    // Update order status
    const updatedOrder = await this.orderRepo.updateStatus(orderId, 'accepted');

    // Create status history entry
    await this.statusHistoryRepo.create(orderId, 'accepted');

    return updatedOrder;
  }

  /**
   * Reject order (Restaurant Owner only)
   */
  async rejectOrder(orderId: string, ownerId: string, reason?: string): Promise<Order> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check authorization
    await this.checkOwnerAuthorization(order.restaurantId, ownerId);

    // Check if order is in pending status
    if (order.orderStatus !== 'pending') {
      throw new ConflictError('Order is not in pending status');
    }

    // Update order status
    const updatedOrder = await this.orderRepo.updateStatus(orderId, 'rejected', undefined, reason);

    // Create status history entry
    await this.statusHistoryRepo.create(orderId, 'rejected', reason);

    return updatedOrder;
  }

  /**
   * Update order status (Restaurant Owner only)
   */
  async updateOrderStatus(
    orderId: string,
    ownerId: string,
    newStatus: OrderStatus,
    notes?: string
  ): Promise<Order> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check authorization
    await this.checkOwnerAuthorization(order.restaurantId, ownerId);

    // Check if order is in final status
    if (['rejected', 'delivered', 'cancelled'].includes(order.orderStatus)) {
      throw new ConflictError('Order is already in final status');
    }

    // Validate status transition
    const allowedTransitions = VALID_TRANSITIONS[order.orderStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new ConflictError(`Invalid status transition from ${order.orderStatus} to ${newStatus}`);
    }

    // Update order status
    const updatedOrder = await this.orderRepo.updateStatus(orderId, newStatus, undefined, notes);

    // Create status history entry
    await this.statusHistoryRepo.create(orderId, newStatus, notes);

    return updatedOrder;
  }

  /**
   * Check if restaurant is currently open
   */
  private async isRestaurantOpen(restaurantId: string): Promise<boolean> {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) {
      return false;
    }

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const todayHours = restaurant.openingHours.find(h => h.dayOfWeek === dayOfWeek);
    
    if (!todayHours || todayHours.isClosed) {
      return false;
    }

    if (!todayHours.openTime || !todayHours.closeTime) {
      return false;
    }

    return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
  }

  /**
   * Calculate estimated delivery time
   */
  private async calculateEstimatedDelivery(dishes: any[]): Promise<number> {
    // Find longest cooking time
    const maxCookingTime = Math.max(...dishes.map(d => d.cookingTimeMinutes || 0));

    let estimatedTime = maxCookingTime;

    // Add rush hour time (17:00-19:00)
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 17 && hour < 19) {
      estimatedTime += Math.floor(Math.random() * 6) + 5; // 5-10 minutes
    }

    // Add delivery time (flat 10 minutes)
    estimatedTime += 10;

    return estimatedTime;
  }

  /**
   * Check if owner is authorized for the restaurant
   */
  private async checkOwnerAuthorization(restaurantId: string, ownerId: string): Promise<void> {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    if (restaurant.ownerId !== ownerId) {
      throw new AuthorizationError('You do not have permission to manage orders for this restaurant');
    }
  }
}
