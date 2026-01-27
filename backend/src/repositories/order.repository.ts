import { Database } from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';

export type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  dailyOrderNumber: number;
  orderDate: string;
  orderStatus: OrderStatus;
  subtotal: number;
  discountAmount: number;
  finalPrice: number;
  voucherId?: number;
  voucherCode?: string;
  deliveryStreet: string;
  deliveryHouseNumber: string;
  deliveryStaircase?: string;
  deliveryDoor?: string;
  deliveryPostalCode: string;
  deliveryCity: string;
  estimatedDeliveryMinutes: number;
  customerNotes?: string;
  restaurantNotes?: string;
  createdAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  preparingStartedAt?: string;
  readyAt?: string;
  deliveringStartedAt?: string;
  deliveredAt?: string;
  updatedAt: string;
}

export interface CreateOrderData {
  customerId: string;
  restaurantId: string;
  subtotal: number;
  discountAmount: number;
  finalPrice: number;
  voucherId?: number;
  voucherCode?: string;
  deliveryAddress: {
    street: string;
    houseNumber: string;
    staircase?: string;
    door?: string;
    postalCode: string;
    city: string;
  };
  estimatedDeliveryMinutes: number;
  customerNotes?: string;
}

export interface OrderWithRestaurant extends Order {
  restaurantName: string;
  restaurantStreet: string;
  restaurantHouseNumber: string;
  restaurantPostalCode: string;
  restaurantCity: string;
}

export interface OrderItem {
  id: number;
  dishId?: number;
  dishName: string;
  dishPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderWithCustomer extends Order {
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  totalItems?: number;
  items?: OrderItem[];
}

export class OrderRepository {
  constructor(private db: Database) {}

  /**
   * Create a new order
   */
  create(orderData: CreateOrderData): Promise<Order> {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const now = new Date().toISOString();
      const orderDate = now.split('T')[0]; // YYYY-MM-DD format

      const db = this.db; // Capture database reference
      
      // First, get the next daily order number for this restaurant
      const getNextNumberSql = `
        SELECT COALESCE(MAX(daily_order_number), 0) + 1 as next_number
        FROM orders 
        WHERE restaurant_id = ? AND order_date = ?
      `;
      
      this.db.get(getNextNumberSql, [orderData.restaurantId, orderDate], (err, row: any) => {
        if (err) return reject(err);
        
        const dailyOrderNumber = row?.next_number || 1;

        const sql = `
          INSERT INTO orders (
            id, customer_id, restaurant_id, order_status,
            daily_order_number, order_date,
            subtotal, discount_amount, final_price,
            voucher_id, voucher_code,
            delivery_street, delivery_house_number, delivery_staircase, delivery_door,
            delivery_postal_code, delivery_city,
            estimated_delivery_minutes, customer_notes,
            created_at, updated_at
          ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(
          sql,
          [
            id,
            orderData.customerId,
            orderData.restaurantId,
            dailyOrderNumber,
            orderDate,
            orderData.subtotal,
            orderData.discountAmount,
            orderData.finalPrice,
            orderData.voucherId || null,
            orderData.voucherCode || null,
            orderData.deliveryAddress.street,
            orderData.deliveryAddress.houseNumber,
            orderData.deliveryAddress.staircase || null,
            orderData.deliveryAddress.door || null,
            orderData.deliveryAddress.postalCode,
            orderData.deliveryAddress.city,
            orderData.estimatedDeliveryMinutes,
            orderData.customerNotes || null,
            now,
            now
          ],
          function (err) {
            if (err) return reject(err);

            const selectSql = 'SELECT * FROM orders WHERE id = ?';
            db.get(selectSql, [id], (err: Error | null, row: any) => {
              if (err) return reject(err);
              if (!row) return reject(new Error('Order not found after creation'));
              resolve(mapRowToOrder(row));
            });
          }
        );
      });
    });
  }

  /**
   * Find order by ID
   */
  findById(id: string): Promise<Order | null> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM orders WHERE id = ?';
      this.db.get(sql, [id], (err, row: any) => {
        if (err) return reject(err);
        resolve(row ? mapRowToOrder(row) : null);
      });
    });
  }

  /**
   * Find orders by customer ID
   */
  findByCustomerId(
    customerId: string,
    filters?: {
      status?: OrderStatus;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<OrderWithRestaurant[]> {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          o.*,
          r.name as restaurant_name,
          r.street as restaurant_street,
          r.house_number as restaurant_house_number,
          r.postal_code as restaurant_postal_code,
          r.city as restaurant_city
        FROM orders o
        JOIN restaurants r ON o.restaurant_id = r.id
        WHERE o.customer_id = ?
      `;

      const params: any[] = [customerId];

      if (filters?.status) {
        sql += ' AND o.order_status = ?';
        params.push(filters.status);
      }

      if (filters?.dateFrom) {
        sql += ' AND o.created_at >= ?';
        params.push(filters.dateFrom);
      }

      if (filters?.dateTo) {
        sql += ' AND o.created_at <= ?';
        params.push(filters.dateTo);
      }

      sql += ' ORDER BY o.created_at DESC';

      if (filters?.limit) {
        sql += ' LIMIT ?';
        params.push(filters.limit);
      }

      if (filters?.offset) {
        sql += ' OFFSET ?';
        params.push(filters.offset);
      }

      this.db.all(sql, params, (err, rows: any[]) => {
        if (err) return reject(err);
        resolve(rows.map(mapRowToOrderWithRestaurant));
      });
    });
  }

  /**
   * Find orders by restaurant ID
   */
  findByRestaurantId(
    restaurantId: string,
    filters?: {
      status?: OrderStatus;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<OrderWithCustomer[]> {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          o.*,
          c.first_name as customer_first_name,
          c.last_name as customer_last_name,
          c.email as customer_email,
          COALESCE(SUM(oi.quantity), 0) as total_items
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.restaurant_id = ?
      `;

      const params: any[] = [restaurantId];

      if (filters?.status) {
        sql += ' AND o.order_status = ?';
        params.push(filters.status);
      }

      if (filters?.dateFrom) {
        sql += ' AND o.created_at >= ?';
        params.push(filters.dateFrom);
      }

      if (filters?.dateTo) {
        sql += ' AND o.created_at <= ?';
        params.push(filters.dateTo);
      }

      sql += ' GROUP BY o.id, c.first_name, c.last_name, c.email';
      sql += ' ORDER BY o.created_at DESC';

      if (filters?.limit) {
        sql += ' LIMIT ?';
        params.push(filters.limit);
      }

      if (filters?.offset) {
        sql += ' OFFSET ?';
        params.push(filters.offset);
      }

      const db = this.db;
      this.db.all(sql, params, (err, rows: any[]) => {
        if (err) return reject(err);
        
        // If no orders, return empty array
        if (rows.length === 0) {
          return resolve([]);
        }
        
        // Get all order IDs to fetch items
        const orderIds = rows.map(r => r.id);
        const placeholders = orderIds.map(() => '?').join(',');
        
        const itemsSql = `
          SELECT order_id, id, dish_id, dish_name, dish_price, quantity, subtotal
          FROM order_items
          WHERE order_id IN (${placeholders})
          ORDER BY id
        `;
        
        db.all(itemsSql, orderIds, (itemsErr, itemRows: any[]) => {
          if (itemsErr) return reject(itemsErr);
          
          // Group items by order_id
          const itemsByOrderId: { [orderId: string]: OrderItem[] } = {};
          itemRows.forEach((item: any) => {
            if (!itemsByOrderId[item.order_id]) {
              itemsByOrderId[item.order_id] = [];
            }
            itemsByOrderId[item.order_id].push({
              id: item.id,
              dishId: item.dish_id,
              dishName: item.dish_name,
              dishPrice: item.dish_price,
              quantity: item.quantity,
              subtotal: item.subtotal
            });
          });
          
          // Map orders with their items
          const ordersWithItems = rows.map(row => ({
            ...mapRowToOrderWithCustomer(row),
            totalItems: row.total_items,
            items: itemsByOrderId[row.id] || []
          }));
          
          resolve(ordersWithItems);
        });
      });
    });
  }

  /**
   * Update order status
   */
  updateStatus(
    orderId: string,
    status: OrderStatus,
    timestamp?: string,
    notes?: string
  ): Promise<Order> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const timestampValue = timestamp || now;

      let statusField = '';
      switch (status) {
        case 'accepted':
          statusField = 'accepted_at';
          break;
        case 'rejected':
          statusField = 'rejected_at';
          break;
        case 'preparing':
          statusField = 'preparing_started_at';
          break;
        case 'ready':
          statusField = 'ready_at';
          break;
        case 'delivering':
          statusField = 'delivering_started_at';
          break;
        case 'delivered':
          statusField = 'delivered_at';
          break;
      }

      let sql = `
        UPDATE orders 
        SET order_status = ?, updated_at = ?
      `;

      const params: any[] = [status, now];

      if (statusField) {
        sql += `, ${statusField} = ?`;
        params.push(timestampValue);
      }

      if (notes) {
        sql += ', restaurant_notes = ?';
        params.push(notes);
      }

      sql += ' WHERE id = ?';
      params.push(orderId);

      const db = this.db; // Capture database reference
      this.db.run(sql, params, function (err) {
        if (err) return reject(err);

        const selectSql = 'SELECT * FROM orders WHERE id = ?';
        db.get(selectSql, [orderId], (err: Error | null, row: any) => {
          if (err) return reject(err);
          if (!row) return reject(new Error('Order not found'));
          resolve(mapRowToOrder(row));
        });
      });
    });
  }

  /**
   * Check if order exists and belongs to restaurant
   */
  checkOrderBelongsToRestaurant(orderId: string, restaurantId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id FROM orders WHERE id = ? AND restaurant_id = ?';
      this.db.get(sql, [orderId, restaurantId], (err, row: any) => {
        if (err) return reject(err);
        resolve(!!row);
      });
    });
  }

  /**
   * Check if order exists and belongs to customer
   */
  checkOrderBelongsToCustomer(orderId: string, customerId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id FROM orders WHERE id = ? AND customer_id = ?';
      this.db.get(sql, [orderId, customerId], (err, row: any) => {
        if (err) return reject(err);
        resolve(!!row);
      });
    });
  }
}

// Helper function to map database row to Order object
function mapRowToOrder(row: any): Order {
  return {
    id: row.id,
    customerId: row.customer_id,
    restaurantId: row.restaurant_id,
    dailyOrderNumber: row.daily_order_number,
    orderDate: row.order_date,
    orderStatus: row.order_status as OrderStatus,
    subtotal: row.subtotal,
    discountAmount: row.discount_amount,
    finalPrice: row.final_price,
    voucherId: row.voucher_id,
    voucherCode: row.voucher_code,
    deliveryStreet: row.delivery_street,
    deliveryHouseNumber: row.delivery_house_number,
    deliveryStaircase: row.delivery_staircase,
    deliveryDoor: row.delivery_door,
    deliveryPostalCode: row.delivery_postal_code,
    deliveryCity: row.delivery_city,
    estimatedDeliveryMinutes: row.estimated_delivery_minutes,
    customerNotes: row.customer_notes,
    restaurantNotes: row.restaurant_notes,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at,
    rejectedAt: row.rejected_at,
    preparingStartedAt: row.preparing_started_at,
    readyAt: row.ready_at,
    deliveringStartedAt: row.delivering_started_at,
    deliveredAt: row.delivered_at,
    updatedAt: row.updated_at
  };
}

function mapRowToOrderWithRestaurant(row: any): OrderWithRestaurant {
  return {
    ...mapRowToOrder(row),
    restaurantName: row.restaurant_name,
    restaurantStreet: row.restaurant_street,
    restaurantHouseNumber: row.restaurant_house_number,
    restaurantPostalCode: row.restaurant_postal_code,
    restaurantCity: row.restaurant_city
  };
}

function mapRowToOrderWithCustomer(row: any): OrderWithCustomer {
  return {
    ...mapRowToOrder(row),
    customerFirstName: row.customer_first_name,
    customerLastName: row.customer_last_name,
    customerEmail: row.customer_email
  };
}
