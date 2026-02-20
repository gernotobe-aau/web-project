import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { CartController } from '../controllers/cart.controller';
import { CartService } from '../../business/cart.service';
import { getDb } from '../../db/init';

const router = Router();

// Lazy-initialize controller to avoid calling getDb during module load
let cartController: CartController | null = null;
function getController(): CartController {
  if (!cartController) {
    const cartService = new CartService(getDb());
    cartController = new CartController(cartService);
  }
  return cartController;
}

// Middleware to check user role
function requireRole(role: 'customer') {
  return (req: any, res: any, next: any) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRole = user.role
    
    if (userRole !== role) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
}

// Customer routes - require auth and customer role
router.post('/cart', requireAuth, requireRole('customer'), (req, res, next) => {
  console.log('got post command to save cart')
  getController().saveCart(req, res, next)
});

router.get('/cart', requireAuth, requireRole('customer'), (req, res, next) =>{
  getController().getCart(req, res, next)
})

export default router
