import { Router, Request, Response } from 'express';
import { RestaurantController } from '../controllers/restaurant.controller';
import { getDb } from '../../db/init';
import { RestaurantRepository } from '../../repositories/restaurant.repository';
import { RestaurantBrowsingService } from '../../business/restaurant-browsing.service';

const router = Router();

// Lazy initialization for controller
let restaurantController: RestaurantController | null = null;

function getRestaurantController(): RestaurantController {
  if (!restaurantController) {
    const db = getDb();
    const restaurantRepository = new RestaurantRepository(db);
    const restaurantBrowsingService = new RestaurantBrowsingService(restaurantRepository);
    restaurantController = new RestaurantController(restaurantBrowsingService);
  }
  return restaurantController;
}



// Direct route handlers without wrapper
router.get('/restaurants', async (req: Request, res: Response) => {
  try {
    const controller = getRestaurantController();
    await controller.getRestaurants(req, res);
  } catch (error) {
    console.error('Error in /restaurants route:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/categories', async (req: Request, res: Response) => {
  try {
    const controller = getRestaurantController();
    await controller.getCategories(req, res);
  } catch (error) {
    console.error('Error in /categories route:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Neue Route für einzelnes Restaurant
router.get('/restaurants/:id', async (req: Request, res: Response) => {
  try {
    const controller = getRestaurantController();
    await controller.getRestaurantById(req, res);
  } catch (error) {
    console.error('Error in /restaurants/:id route:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
