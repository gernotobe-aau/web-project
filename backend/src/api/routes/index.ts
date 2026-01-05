import { Router } from 'express';
import authRoutes from './auth.routes';
import menuRoutes from './menu.routes';
import restaurantRoutes from './restaurant.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/menu', menuRoutes);
router.use('/', restaurantRoutes);

export default router;
