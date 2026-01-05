import { Router } from 'express';
import { RestaurantProfileController } from '../controllers/restaurant-profile.controller';
import { getDb } from '../../db/init';
import { RestaurantRepository } from '../../repositories/restaurant.repository';
import { RestaurantProfileService } from '../../business/restaurant-profile.service';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

// Lazy initialization for controller
let restaurantProfileController: RestaurantProfileController | null = null;

function getRestaurantProfileController(): RestaurantProfileController {
  if (!restaurantProfileController) {
    const db = getDb();
    const restaurantRepository = new RestaurantRepository(db);
    const restaurantProfileService = new RestaurantProfileService(restaurantRepository);
    restaurantProfileController = new RestaurantProfileController(restaurantProfileService);
  }
  return restaurantProfileController;
}

// All routes require authentication
router.use(requireAuth);

// GET /api/restaurants/profile - Get restaurant profile
router.get('/profile', async (req, res) => {
  const controller = getRestaurantProfileController();
  await controller.getProfile(req, res);
});

// PATCH /api/restaurants/profile - Update restaurant profile
router.patch('/profile', async (req, res) => {
  const controller = getRestaurantProfileController();
  await controller.updateProfile(req, res);
});

export default router;
