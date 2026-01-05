import { Router } from 'express';
import authRoutes from './auth.routes';
import menuRoutes from './menu.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/menu', menuRoutes);

export default router;
