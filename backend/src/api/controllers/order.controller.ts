import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../../business/order.service';
import { OrderStatus } from '../../repositories/order.repository';

export class OrderController {
  constructor(private orderService: OrderService) {}

  /**
   * POST /api/orders - Create a new order (Customer only)
   */
  createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const customerId = user.sub;

      const order = await this.orderService.createOrder(customerId, req.body);

      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/orders - Get customer's orders
   */
  getMyOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const customerId = user.sub;

      const filters = {
        status: req.query.status as OrderStatus | undefined,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const orders = await this.orderService.getCustomerOrders(customerId, filters);

      res.status(200).json(orders);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/orders/:id - Get order details by ID
   */
  getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const orderId = req.params.id;

      const order = await this.orderService.getOrderDetails(orderId, user.sub, user.role);

      res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/restaurants/:restaurantId/orders - Get restaurant's orders (Owner only)
   */
  getRestaurantOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const restaurantId = req.params.restaurantId;

      const filters = {
        status: req.query.status as OrderStatus | undefined,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const orders = await this.orderService.getRestaurantOrders(restaurantId, user.sub, filters);

      res.status(200).json(orders);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/orders/:id/accept - Accept an order (Owner only)
   */
  acceptOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const orderId = req.params.id;

      const order = await this.orderService.acceptOrder(orderId, user.sub);

      res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/orders/:id/reject - Reject an order (Owner only)
   */
  rejectOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const orderId = req.params.id;
      const { reason } = req.body;

      const order = await this.orderService.rejectOrder(orderId, user.sub, reason);

      res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/orders/:id/status - Update order status (Owner only)
   */
  updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const orderId = req.params.id;
      const { status, notes } = req.body;

      if (!status) {
        res.status(400).json({ error: 'Status is required' });
        return;
      }

      const order = await this.orderService.updateOrderStatus(orderId, user.sub, status, notes);

      res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  };
}
