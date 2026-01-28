import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../../business/analytics.service';

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  /**
   * GET /api/analytics/orders/daily - Get daily order count
   * Returns the number of orders for today
   */
  getDailyOrderCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const userId = user.sub;

      const data = await this.analyticsService.getDailyOrderCount(userId);

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/analytics/orders/weekly - Get weekly order count
   * Returns the number of orders for the current week (Monday - Sunday)
   */
  getWeeklyOrderCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const userId = user.sub;

      const data = await this.analyticsService.getWeeklyOrderCount(userId);

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/analytics/dishes/top - Get top ordered dishes
   * Returns the most ordered dishes for the current month
   */
  getTopDishes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const userId = user.sub;

      // Parse limit from query params, default to 10
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const data = await this.analyticsService.getTopDishes(userId, limit);

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };
}
