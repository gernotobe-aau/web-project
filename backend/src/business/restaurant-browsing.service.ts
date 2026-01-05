import { RestaurantRepository, Restaurant, OpeningHour } from '../repositories/restaurant.repository';

export interface RestaurantBrowsingDTO {
  id: string;
  name: string;
  categories: string[];
  address: {
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
  };
  averageRating: number | null;
  estimatedDeliveryTime: number;
  isOpen: boolean;
}

export class RestaurantBrowsingService {
  constructor(private restaurantRepository: RestaurantRepository) {}

  /**
   * Get all available restaurants with browsing information
   */
  async getAvailableRestaurants(): Promise<RestaurantBrowsingDTO[]> {
    const restaurants = await this.restaurantRepository.findAll();
    
    const restaurantsWithDetails = await Promise.all(
      restaurants.map(async (restaurant) => {
        const averageRating = await this.restaurantRepository.getAverageRating(restaurant.id);
        const isOpen = this.isRestaurantOpen(restaurant.openingHours);
        const estimatedDeliveryTime = this.calculateDeliveryTime(restaurant.id);

        return {
          id: restaurant.id,
          name: restaurant.name,
          categories: restaurant.categories,
          address: {
            street: restaurant.street,
            houseNumber: restaurant.houseNumber,
            postalCode: restaurant.postalCode,
            city: restaurant.city
          },
          averageRating,
          estimatedDeliveryTime,
          isOpen
        };
      })
    );

    return restaurantsWithDetails;
  }

  /**
   * Calculate estimated delivery time for a restaurant
   * For this iteration: flat 10 minutes
   * Later: will be extended with dish cooking times and peak hour logic
   */
  calculateDeliveryTime(restaurantId: string): number {
    // Base delivery time: 10 minutes (as specified in requirements for this iteration)
    return 10;
  }

  /**
   * Check if a restaurant is currently open based on opening hours
   */
  private isRestaurantOpen(openingHours: OpeningHour[]): boolean {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const currentTime = this.formatTime(now);

    // Find opening hours for current day
    const todayHours = openingHours.find(oh => oh.dayOfWeek === currentDay);

    if (!todayHours) {
      // No opening hours defined for today -> assume closed
      return false;
    }

    if (todayHours.isClosed) {
      return false;
    }

    if (!todayHours.openTime || !todayHours.closeTime) {
      // Invalid opening hours -> assume closed
      return false;
    }

    // Check if current time is within opening hours
    return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
  }

  /**
   * Format time as HH:MM
   */
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
