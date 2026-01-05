import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res, next) => authController.login(req, res, next));

// POST /api/auth/register/customer
router.post('/register/customer', (req, res, next) => authController.registerCustomer(req, res, next));

// POST /api/auth/register/restaurant-owner
router.post('/register/restaurant-owner', (req, res, next) => authController.registerRestaurantOwner(req, res, next));

export default router;
