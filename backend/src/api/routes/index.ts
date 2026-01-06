import { Router } from 'express';
import authRoutes from './auth.routes';
import menuRoutes from './menu.routes';
import restaurantRoutes from './restaurant.routes';
import restaurantProfileRoutes from './restaurant-profile.routes';

const router = Router();


// Public restaurant browsing (must come before any /restaurants/profile or protected route)
router.use('/', restaurantRoutes);

// Auth-protected restaurant profile management
router.use('/restaurants', restaurantProfileRoutes);

router.use('/auth', authRoutes);
router.use('/menu', menuRoutes);

export default router;
