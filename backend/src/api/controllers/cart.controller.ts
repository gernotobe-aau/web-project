import { Request, Response, NextFunction } from 'express';
import { CartService } from '../../business/cart.service';
//import { CartStatus } from '../../repositories/order.repository';

export class CartController {
  constructor(private cartService: CartService) {}

  /**
   * POST /api/cart
   */
  saveCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const customerId = user.sub;

      console.log("controller save cart")
      const cart = await this.cartService.saveCart(customerId, req.body);

      res.status(200).json(cart);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/cart - Get customer's cart
   */
  getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const customerId = user.sub;


      const cart = await this.cartService.getCart(customerId);

      res.status(200).json(cart);
    } catch (error) {
      next(error);
    }
  };


  checkConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> =>{
    try{
      
    res.status(200).json(true)
      
    }catch(e) {
      console.log('No connection:', e)
      next(e)
    }
  }
}
