import { Database } from 'sqlite3';

export interface Dish {
  id: number;
  restaurant_id: number;
  category_id: number | null;
  name: string;
  description: string | null;
  price: number;
  display_order: number;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDishData {
  restaurant_id: number;
  category_id?: number | null;
  name: string;
  description?: string | null;
  price: number;
  display_order?: number;
  photo_url?: string | null;
}

export interface UpdateDishData {
  category_id?: number | null;
  name?: string;
  description?: string | null;
  price?: number;
  display_order?: number;
  photo_url?: string | null;
}

export class DishRepository {
  constructor(private db: Database) {}

  /**
   * Find all dishes for a restaurant
   */
  async findByRestaurantId(restaurantId: number, categoryId?: number): Promise<Dish[]> {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT * FROM dishes 
        WHERE restaurant_id = ?
      `;
      const params: any[] = [restaurantId];

      if (categoryId !== undefined) {
        if (categoryId === null) {
          query += ' AND category_id IS NULL';
        } else {
          query += ' AND category_id = ?';
          params.push(categoryId);
        }
      }

      query += ' ORDER BY display_order DESC, name ASC';

      this.db.all(query, params, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Find dish by ID
   */
  async findById(dishId: number): Promise<Dish | null> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM dishes WHERE id = ?';

      this.db.get(query, [dishId], (err, row: any) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  /**
   * Find dishes by category
   */
  async findByCategoryId(categoryId: number): Promise<Dish[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM dishes 
        WHERE category_id = ?
        ORDER BY display_order DESC, name ASC
      `;

      this.db.all(query, [categoryId], (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Create a new dish
   */
  async create(data: CreateDishData): Promise<Dish> {
    const db = this.db;
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO dishes (
          restaurant_id, category_id, name, description, price, display_order, photo_url,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;

      const display_order = data.display_order ?? 0;

      db.run(
        query,
        [
          data.restaurant_id,
          data.category_id ?? null,
          data.name,
          data.description ?? null,
          data.price,
          display_order,
          data.photo_url ?? null,
        ],
        function(this: any, err: any) {
          if (err) {
            reject(err);
          } else {
            const lastID = this.lastID;
            // Fetch the created dish
            const selectQuery = 'SELECT * FROM dishes WHERE id = ?';
            db.get(selectQuery, [lastID], (err: any, row: any) => {
              if (err) reject(err);
              else resolve(row);
            });
          }
        }
      );
    });
  }

  /**
   * Update a dish
   */
  async update(dishId: number, data: UpdateDishData): Promise<Dish | null> {
    return new Promise((resolve, reject) => {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }
      if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description);
      }
      if (data.price !== undefined) {
        updates.push('price = ?');
        values.push(data.price);
      }
      if (data.category_id !== undefined) {
        updates.push('category_id = ?');
        values.push(data.category_id);
      }
      if (data.display_order !== undefined) {
        updates.push('display_order = ?');
        values.push(data.display_order);
      }
      if (data.photo_url !== undefined) {
        updates.push('photo_url = ?');
        values.push(data.photo_url);
      }

      if (updates.length === 0) {
        // No updates, just return current dish
        this.findById(dishId).then(resolve).catch(reject);
        return;
      }

      updates.push("updated_at = datetime('now')");
      values.push(dishId);

      const query = `UPDATE dishes SET ${updates.join(', ')} WHERE id = ?`;

      this.db.run(query, values, (err) => {
        if (err) {
          reject(err);
        } else {
          this.findById(dishId).then(resolve).catch(reject);
        }
      });
    });
  }

  /**
   * Delete a dish
   */
  async delete(dishId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM dishes WHERE id = ?';

      this.db.run(query, [dishId], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  /**
   * Reorder dishes - update display_order for multiple dishes
   */
  async reorder(dishOrders: Array<{ id: number; display_order: number }>): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(
        "UPDATE dishes SET display_order = ?, updated_at = datetime('now') WHERE id = ?"
      );

      let error: Error | null = null;

      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');

        dishOrders.forEach(({ id, display_order }) => {
          stmt.run([display_order, id], (err) => {
            if (err && !error) error = err;
          });
        });

        stmt.finalize((err) => {
          if (err && !error) error = err;

          if (error) {
            this.db.run('ROLLBACK', () => reject(error));
          } else {
            this.db.run('COMMIT', (err) => {
              if (err) reject(err);
              else resolve();
            });
          }
        });
      });
    });
  }

  /**
   * Get full menu with categories and dishes
   */
  async getFullMenu(restaurantId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const categoryQuery = `
        SELECT * FROM categories 
        WHERE restaurant_id = ?
        ORDER BY display_order ASC, name ASC
      `;

      this.db.all(categoryQuery, [restaurantId], async (err, categories: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const menu = await Promise.all(
            categories.map(async (category) => {
              const dishes = await this.findByCategoryId(category.id);
              return {
                ...category,
                dishes,
              };
            })
          );

          resolve(menu);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}

