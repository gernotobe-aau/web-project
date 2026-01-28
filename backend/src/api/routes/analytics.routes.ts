import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { AnalyticsController } from '../controllers/analytics.controller';
import { AnalyticsService } from '../../business/analytics.service';
import { getDb } from '../../db/init';

const router = Router();

// Lazy-initialize controller to avoid calling getDb during module load
let analyticsController: AnalyticsController | null = null;
function getController(): AnalyticsController {
  if (!analyticsController) {
    const analyticsService = new AnalyticsService(getDb());
    analyticsController = new AnalyticsController(analyticsService);
  }
  return analyticsController;
}

// Middleware to check user role
function requireRole(role: 'customer' | 'restaurant_owner') {
  return (req: any, res: any, next: any) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Normalize role names (backend uses 'restaurantOwner', but we check for 'restaurant_owner')
    const userRole = user.role === 'restaurantOwner' ? 'restaurant_owner' : user.role;
    
    if (userRole !== role) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
}

// All analytics routes require authentication and restaurant owner role
router.get('/analytics/orders/daily', requireAuth, requireRole('restaurant_owner'), (req, res, next) =>
  getController().getDailyOrderCount(req, res, next)
);

router.get('/analytics/orders/weekly', requireAuth, requireRole('restaurant_owner'), (req, res, next) =>
  getController().getWeeklyOrderCount(req, res, next)
);

router.get('/analytics/dishes/top', requireAuth, requireRole('restaurant_owner'), (req, res, next) =>
  getController().getTopDishes(req, res, next)
);

export default router;
