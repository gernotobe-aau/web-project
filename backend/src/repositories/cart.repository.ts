import { Database } from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';

export interface Cart {
  customerId: string;
  
  //subtotal: number;
  //finalPrice: number;
  voucherId?: number;
  voucherCode?: string;
  customerNotes?: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  restaurantId: string;
  dishId: number;
  quantity: number;
  note: string;
  createdAt: string;
}



export class CartRepository {
  constructor(private db: Database) {}

  /**
   * Create/save cart
   */
  async save(cart: Cart): Promise<Cart> {
    return new Promise((resolve, reject) => {
      //const id = uuidv4();
      //const now = new Date().toISOString();
      //const orderDate = now.split('T')[0]; // YYYY-MM-DD format

      const db = this.db; // Capture database reference
      //db.run(`
      //  DELETE FROM _migrations where id > 6`)



      if(cart.items && cart.items.length > 0){
        const placeholder = cart.items.map(() => "(?, ?)").join(", ");
        const sqldelete = `
        DELETE FROM cart_items
        WHERE (restaurant_id, dish_id) NOT IN (${placeholder})
        AND customer_id = ?`
        const params = cart.items.flatMap(k => [k.restaurantId, k.dishId])
        params.push(cart.customerId)
        db.run(sqldelete, params)
      }else{
        const sqlfulldelete = `
        DELETE FROM cart_items
        WHERE customer_id = ?`
        
        db.run(sqlfulldelete, [cart.customerId])
      }
      


      const sql = `
          INSERT INTO carts (
            customer_id
          ) VALUES (?)
           ON CONFLICT
           DO UPDATE
           SET updated_at = CURRENT_TIMESTAMP
        `;

      const sqlItems = `
          INSERT INTO cart_items (
            customer_id, restaurant_id, dish_id, quantity, note
          ) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT
           DO UPDATE
           SET quantity = EXCLUDED.quantity
        `;//TODO MERGE ITEMS

        console.log('Saving cart', cart)
        db.run(
          sql,
          [
            cart.customerId
          ],
          function (err) {
            if (err){
              console.log('Error saving cart', err)
              return reject(err);}
            if(cart.items.length === 0) return resolve(cart);
            const stmt = db.prepare(sqlItems);
            let completed = 0;
            let hasError = false;
            
            cart.items.forEach((item) =>{
              console.log('Saving:', item)
              stmt.run(
                [
                  cart.customerId,
                  item.restaurantId,
                  item.dishId,
                  item.quantity,
                  item.note
                ],
                (suberr) => {
                  if(suberr && !hasError){
                    hasError = true;
                    stmt.finalize();
                    console.log('Error when saving:', suberr)
                    return reject(err);
                  }
                  console.log('Saved:', item)
                  completed++;
                  if(completed === cart.items.length && !hasError){
                    stmt.finalize((subsuberr) =>{
                      if(subsuberr) return reject(subsuberr);
                      console.log('All carts saved')
                      resolve(cart);
                    })
                  }
                }
              )
            })
          }
        );
    });
  }

  /**
   * Find cart by customerId
   */
  findById(customerId: string): Promise<Cart | null> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM carts WHERE customer_id = ?';
      const db = this.db
      db.get(sql, [customerId], (err, row: any) => {
        if (err) return reject(err);
        if(!row){
          return resolve(null) 
        }
        const cart = mapRowToCart(row)
        const itemsql = 'SELECT * FROM cart_items WHERE customer_id = ?'
        db.all(itemsql, [customerId], (err, rows: any[]) => {
          if(err) return reject(err)
          cart.items = rows.map(mapRowToCartItem)
          console.log('getting cart from backend:', cart)
          resolve(cart)
        })
      });
    });
  }
}

// Helper function to map database row to Cart object
function mapRowToCart(row: any): Cart {
  return {
    customerId: row.customer_id,
    voucherId: row.voucher_id,
    voucherCode: row.voucher_code,
    customerNotes: row.customer_notes,
    items: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapRowToCartItem(row: any): CartItem {
  return {
    restaurantId: row.restaurant_id,
    dishId: row.dish_id,
    quantity: row.quantity,
    note: row.note,
    createdAt: row.created_at
  };
}
