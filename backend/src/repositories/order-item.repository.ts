import { Database } from 'sqlite3';

export interface OrderItem {
  id: number;
  orderId: string;
  dishId?: number;
  dishName: string;
  dishPrice: number;
  quantity: number;
  subtotal: number;
}

export interface CreateOrderItemData {
  orderId: string;
  dishId: number;
  dishName: string;
  dishPrice: number;
  quantity: number;
}

export class OrderItemRepository {
  constructor(private db: Database) {}

  /**
   * Create multiple order items in batch
   */
  createBatch(items: CreateOrderItemData[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (items.length === 0) {
        return resolve();
      }

      const sql = `
        INSERT INTO order_items (
          order_id, dish_id, dish_name, dish_price, quantity, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      const stmt = this.db.prepare(sql);
      let completed = 0;
      let hasError = false;

      items.forEach((item) => {
        const subtotal = item.dishPrice * item.quantity;
        
        stmt.run(
          [
            item.orderId,
            item.dishId,
            item.dishName,
            item.dishPrice,
            item.quantity,
            subtotal
          ],
          (err) => {
            if (err && !hasError) {
              hasError = true;
              stmt.finalize();
              return reject(err);
            }
            
            completed++;
            if (completed === items.length && !hasError) {
              stmt.finalize((err) => {
                if (err) return reject(err);
                resolve();
              });
            }
          }
        );
      });
    });
  }

  /**
   * Find order items by order ID
   */
  findByOrderId(orderId: string): Promise<OrderItem[]> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM order_items WHERE order_id = ? ORDER BY id';
      this.db.all(sql, [orderId], (err, rows: any[]) => {
        if (err) return reject(err);
        resolve(rows.map(mapRowToOrderItem));
      });
    });
  }

  /**
   * Find order item by ID
   */
  findById(id: number): Promise<OrderItem | null> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM order_items WHERE id = ?';
      this.db.get(sql, [id], (err, row: any) => {
        if (err) return reject(err);
        resolve(row ? mapRowToOrderItem(row) : null);
      });
    });
  }
}

// Helper function to map database row to OrderItem object
function mapRowToOrderItem(row: any): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    dishId: row.dish_id,
    dishName: row.dish_name,
    dishPrice: row.dish_price,
    quantity: row.quantity,
    subtotal: row.subtotal
  };
}
