import { Request, Response } from 'express';
import { RestaurantBrowsingService } from '../../business/restaurant-browsing.service';
import config from '../../config/config';

export class RestaurantController {
  constructor(private restaurantBrowsingService: RestaurantBrowsingService) {}

  /**
   * GET /api/restaurants
   * Get all available restaurants
   */
  async getRestaurants(req: Request, res: Response): Promise<void> {
    try {
      const restaurants = await this.restaurantBrowsingService.getAvailableRestaurants();
      res.status(200).json(restaurants);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      res.status(500).json({ 
        message: 'Fehler beim Laden der Restaurants',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/restaurants/:id
   * Get a specific restaurant by ID
   */
  async getRestaurantById(req: Request, res: Response): Promise<void> {
    try {
      const restaurant = await this.restaurantBrowsingService.getRestaurantById(req.params.id);
      if (restaurant) {
        res.status(200).json(restaurant);
      } else {
        res.status(404).json({ message: 'Restaurant nicht gefunden' });
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      res.status(500).json({ 
        message: 'Fehler beim Laden des Restaurants',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/categories
   * Get all available cuisine categories from configuration
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = config.cuisineCategories;
      res.status(200).json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ 
        message: 'Fehler beim Laden der Kategorien',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
