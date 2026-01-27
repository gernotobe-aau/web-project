import { Database } from 'sqlite3';
import { OrderStatus } from './order.repository';

export interface OrderStatusHistory {
  id: number;
  orderId: string;
  status: OrderStatus;
  changedAt: string;
  notes?: string;
}

export class OrderStatusHistoryRepository {
  constructor(private db: Database) {}

  /**
   * Create a status history entry
   */
  create(orderId: string, status: OrderStatus, notes?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const sql = `
        INSERT INTO order_status_history (order_id, status, changed_at, notes)
        VALUES (?, ?, ?, ?)
      `;

      this.db.run(sql, [orderId, status, now, notes || null], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  /**
   * Find history entries for an order
   */
  findByOrderId(orderId: string): Promise<OrderStatusHistory[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM order_status_history 
        WHERE order_id = ? 
        ORDER BY changed_at ASC
      `;

      this.db.all(sql, [orderId], (err, rows: any[]) => {
        if (err) return reject(err);
        resolve(rows.map(mapRowToStatusHistory));
      });
    });
  }
}

// Helper function to map database row to OrderStatusHistory object
function mapRowToStatusHistory(row: any): OrderStatusHistory {
  return {
    id: row.id,
    orderId: row.order_id,
    status: row.status as OrderStatus,
    changedAt: row.changed_at,
    notes: row.notes
  };
}
