import { Router } from 'express';
import authRoutes from './auth.routes';
import menuRoutes from './menu.routes';
import restaurantRoutes from './restaurant.routes';
import restaurantProfileRoutes from './restaurant-profile.routes';
import customerProfileRoutes from './customer-profile.routes';
import orderRoutes from './order.routes';
import voucherRoutes from './voucher.routes';
import analyticsRoutes from './analytics.routes';
import cartRoutes from './cart.routes'
import forumRoutes from './forum.routes'
import restaurantReviewRouter from './restaurant-review.routes'

const router = Router();

// Public voucher validation
router.use('/', voucherRoutes);

// Auth-protected restaurant profile management (must come BEFORE public restaurant browsing to avoid conflicts)
router.use('/restaurants', restaurantProfileRoutes);

// Public restaurant browsing (must come after protected routes)
router.use('/', restaurantRoutes);

//Auth-protected customer profile management
router.use('/customers', customerProfileRoutes);

router.use('/auth', authRoutes);
router.use('/menu', menuRoutes);
router.use('/cart', cartRoutes);

// Order management routes
router.use('/', orderRoutes);

// Analytics routes (restaurant owner only)
router.use('/', analyticsRoutes);

// Restaurant Reviews
router.use('/', restaurantReviewRouter);

router.use('/forum', forumRoutes);

export default router;
