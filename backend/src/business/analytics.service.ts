import { Database } from 'sqlite3';
import { AnalyticsRepository, TopDish } from '../repositories/analytics.repository';
import { RestaurantRepository } from '../repositories/restaurant.repository';
import { AuthorizationError, NotFoundError } from '../middleware/error.middleware';

export interface DailyAnalyticsResponse {
  date: string;
  orderCount: number;
}

export interface WeeklyAnalyticsResponse {
  weekStart: string;
  weekEnd: string;
  weekNumber: number;
  orderCount: number;
}

export interface TopDishesResponse {
  period: string;
  periodStart: string;
  periodEnd: string;
  dishes: TopDish[];
}

export class AnalyticsService {
  private analyticsRepo: AnalyticsRepository;
  private restaurantRepo: RestaurantRepository;

  constructor(db: Database) {
    this.analyticsRepo = new AnalyticsRepository(db);
    this.restaurantRepo = new RestaurantRepository(db);
  }

  /**
   * Get daily order count for today
   * Business rule: Only count orders with status accepted or higher (not pending or rejected)
   */
  async getDailyOrderCount(userId: string): Promise<DailyAnalyticsResponse> {
    // Authorization: Get restaurant owned by this user
    const restaurantId = await this.getRestaurantIdForOwner(userId);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    const result = await this.analyticsRepo.getDailyOrderCount(restaurantId, today);

    return {
      date: result.date,
      orderCount: result.orderCount
    };
  }

  /**
   * Get weekly order count for current week (Monday - Sunday)
   * Business rule: Only count orders with status accepted or higher
   */
  async getWeeklyOrderCount(userId: string): Promise<WeeklyAnalyticsResponse> {
    // Authorization: Get restaurant owned by this user
    const restaurantId = await this.getRestaurantIdForOwner(userId);

    // Calculate current week start (Monday) and end (Sunday)
    const { weekStart, weekEnd } = this.getCurrentWeekRange();

    const result = await this.analyticsRepo.getWeeklyOrderCount(restaurantId, weekStart, weekEnd);

    return {
      weekStart: result.weekStart,
      weekEnd: result.weekEnd,
      weekNumber: result.weekNumber,
      orderCount: result.orderCount
    };
  }

  /**
   * Get top dishes for all time
   * Business rule: Only count dishes from orders with status accepted or higher
   */
  async getTopDishes(userId: string, limit: number = 10): Promise<TopDishesResponse> {
    // Authorization: Get restaurant owned by this user
    const restaurantId = await this.getRestaurantIdForOwner(userId);

    // Validate limit
    if (limit < 1 || limit > 50) {
      limit = 10;
    }

    // Use very old start date and far future end date to get all records
    const allTimeStart = '1900-01-01';
    const allTimeEnd = '2099-12-31';

    const dishes = await this.analyticsRepo.getTopDishes(restaurantId, allTimeStart, allTimeEnd, limit);

    return {
      period: 'all-time',
      periodStart: allTimeStart,
      periodEnd: allTimeEnd,
      dishes
    };
  }

  /**
   * Helper method: Get restaurant ID for a restaurant owner user
   * Throws AuthorizationError if user is not a restaurant owner or restaurant not found
   */
  private async getRestaurantIdForOwner(ownerId: string): Promise<string> {
    const restaurants = await this.restaurantRepo.findByOwnerId(ownerId);
    
    if (!restaurants || restaurants.length === 0) {
      throw new NotFoundError('No restaurant found for this owner');
    }

    // Return the first restaurant (an owner should have exactly one restaurant)
    return restaurants[0].id;
  }

  /**
   * Helper method: Get current week range (Monday to Sunday)
   */
  private getCurrentWeekRange(): { weekStart: string; weekEnd: string } {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Calculate days to subtract to get to Monday (start of week)
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    // Calculate Monday (week start)
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);
    
    // Calculate Sunday (week end)
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return {
      weekStart: monday.toISOString().split('T')[0],
      weekEnd: sunday.toISOString().split('T')[0]
    };
  }
}
