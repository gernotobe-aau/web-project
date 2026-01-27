import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { OrderController } from '../controllers/order.controller';
import { OrderService } from '../../business/order.service';
import { getDb } from '../../db/init';

const router = Router();

// Lazy-initialize controller to avoid calling getDb during module load
let orderController: OrderController | null = null;
function getController(): OrderController {
  if (!orderController) {
    const orderService = new OrderService(getDb());
    orderController = new OrderController(orderService);
  }
  return orderController;
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

// Customer routes - require auth and customer role
router.post('/orders', requireAuth, requireRole('customer'), (req, res, next) => 
  getController().createOrder(req, res, next)
);

router.get('/orders/my', requireAuth, requireRole('customer'), (req, res, next) => 
  getController().getMyOrders(req, res, next)
);

// Restaurant Owner routes
router.get('/restaurants/:restaurantId/orders', requireAuth, requireRole('restaurant_owner'), (req, res, next) =>
  getController().getRestaurantOrders(req, res, next)
);

router.post('/restaurants/:restaurantId/orders/:orderId/accept', requireAuth, requireRole('restaurant_owner'), (req, res, next) =>
  getController().acceptOrder(req, res, next)
);

router.post('/restaurants/:restaurantId/orders/:orderId/reject', requireAuth, requireRole('restaurant_owner'), (req, res, next) =>
  getController().rejectOrder(req, res, next)
);

router.patch('/restaurants/:restaurantId/orders/:orderId/status', requireAuth, requireRole('restaurant_owner'), (req, res, next) =>
  getController().updateOrderStatus(req, res, next)
);

export default router;
