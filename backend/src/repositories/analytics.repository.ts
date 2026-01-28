import { Database } from 'sqlite3';

export interface DailyOrderCount {
  date: string;
  orderCount: number;
}

export interface WeeklyOrderCount {
  weekStart: string;
  weekEnd: string;
  weekNumber: number;
  orderCount: number;
}

export interface TopDish {
  dishId: number;
  dishName: string;
  orderCount: number;
  totalQuantity: number;
}

export class AnalyticsRepository {
  constructor(private db: Database) {}

  /**
   * Get the count of orders for today for a specific restaurant
   * Only counts orders with status 'accepted' or higher (not 'pending' or 'rejected')
   */
  getDailyOrderCount(restaurantId: string, date: string): Promise<DailyOrderCount> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as orderCount
        FROM orders
        WHERE restaurant_id = ?
          AND DATE(created_at) = DATE(?)
          AND order_status NOT IN ('rejected', 'cancelled')
          AND order_status != 'pending'
        GROUP BY DATE(created_at)
      `;

      this.db.get(sql, [restaurantId, date], (err, row: any) => {
        if (err) {
          return reject(err);
        }

        // If no orders today, return 0
        if (!row) {
          resolve({
            date: date,
            orderCount: 0
          });
        } else {
          resolve({
            date: row.date,
            orderCount: row.orderCount
          });
        }
      });
    });
  }

  /**
   * Get the count of orders for the current week for a specific restaurant
   * Week starts on Monday and ends on Sunday
   */
  getWeeklyOrderCount(restaurantId: string, weekStart: string, weekEnd: string): Promise<WeeklyOrderCount> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as orderCount
        FROM orders
        WHERE restaurant_id = ?
          AND DATE(created_at) >= DATE(?)
          AND DATE(created_at) <= DATE(?)
          AND order_status NOT IN ('rejected', 'cancelled')
          AND order_status != 'pending'
      `;

      this.db.get(sql, [restaurantId, weekStart, weekEnd], (err, row: any) => {
        if (err) {
          return reject(err);
        }

        const orderCount = row ? row.orderCount : 0;

        // Calculate week number
        const startDate = new Date(weekStart);
        const weekNumber = this.getWeekNumber(startDate);

        resolve({
          weekStart,
          weekEnd,
          weekNumber,
          orderCount
        });
      });
    });
  }

  /**
   * Get top dishes ordered in a specific time period
   * Returns the top N dishes by order count
   */
  getTopDishes(restaurantId: string, periodStart: string, periodEnd: string, limit: number = 10): Promise<TopDish[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          d.id as dishId,
          d.name as dishName,
          COUNT(DISTINCT oi.order_id) as orderCount,
          SUM(oi.quantity) as totalQuantity
        FROM order_items oi
        INNER JOIN orders o ON oi.order_id = o.id
        INNER JOIN dishes d ON oi.dish_id = d.id
        WHERE o.restaurant_id = ?
          AND DATE(o.created_at) >= DATE(?)
          AND DATE(o.created_at) <= DATE(?)
          AND o.order_status NOT IN ('rejected', 'cancelled')
          AND o.order_status != 'pending'
        GROUP BY d.id, d.name
        ORDER BY orderCount DESC, totalQuantity DESC
        LIMIT ?
      `;

      this.db.all(sql, [restaurantId, periodStart, periodEnd, limit], (err, rows: any[]) => {
        if (err) {
          return reject(err);
        }

        const topDishes: TopDish[] = rows.map(row => ({
          dishId: row.dishId,
          dishName: row.dishName,
          orderCount: row.orderCount,
          totalQuantity: row.totalQuantity
        }));

        resolve(topDishes);
      });
    });
  }

  /**
   * Helper method to calculate ISO week number (Monday as first day of week)
   */
  private getWeekNumber(date: Date): number {
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year
    tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
    // January 4 is always in week 1
    const week1 = new Date(tempDate.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1
    return 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }
}
