import { Router } from 'express';
import authRoutes from './auth.routes';
import menuRoutes from './menu.routes';
import restaurantRoutes from './restaurant.routes';
import restaurantProfileRoutes from './restaurant-profile.routes';
import orderRoutes from './order.routes';
import voucherRoutes from './voucher.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

// Public voucher validation
router.use('/', voucherRoutes);

// Public restaurant browsing (must come before any /restaurants/profile or protected route)
router.use('/', restaurantRoutes);

// Auth-protected restaurant profile management
router.use('/restaurants', restaurantProfileRoutes);

router.use('/auth', authRoutes);
router.use('/menu', menuRoutes);

// Order management routes
router.use('/', orderRoutes);

// Analytics routes (restaurant owner only)
router.use('/', analyticsRoutes);

export default router;
