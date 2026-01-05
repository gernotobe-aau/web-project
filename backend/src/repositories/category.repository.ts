import { Database } from 'sqlite3';

export interface Category {
  id: number;
  restaurant_id: number;
  name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithDishCount extends Category {
  dishCount: number;
}

export interface CreateCategoryData {
  restaurant_id: number;
  name: string;
  display_order?: number;
}

export interface UpdateCategoryData {
  name?: string;
  display_order?: number;
}

export class CategoryRepository {
  constructor(private db: Database) {}

  /**
   * Find all categories for a restaurant
   */
  async findByRestaurantId(restaurantId: number): Promise<CategoryWithDishCount[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          c.*,
          COUNT(d.id) as dishCount
        FROM categories c
        LEFT JOIN dishes d ON d.category_id = c.id
        WHERE c.restaurant_id = ?
        GROUP BY c.id
        ORDER BY c.display_order ASC, c.name ASC
      `;
      
      this.db.all(query, [restaurantId], (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Find category by ID
   */
  async findById(categoryId: number): Promise<Category | null> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM categories WHERE id = ?';
      
      this.db.get(query, [categoryId], (err, row: any) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  /**
   * Find category by restaurant and name
   */
  async findByRestaurantAndName(restaurantId: number, name: string): Promise<Category | null> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM categories WHERE restaurant_id = ? AND name = ?';
      
      this.db.get(query, [restaurantId, name], (err, row: any) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  /**
   * Get max display order for a restaurant
   */
  async getMaxDisplayOrder(restaurantId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT MAX(display_order) as max_order FROM categories WHERE restaurant_id = ?';
      
      this.db.get(query, [restaurantId], (err, row: any) => {
        if (err) reject(err);
        else resolve(row?.max_order || 0);
      });
    });
  }

  /**
   * Create a new category
   */
  async create(data: CreateCategoryData): Promise<Category> {
    const db = this.db;
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO categories (restaurant_id, name, display_order, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `;
      
      const displayOrder = data.display_order ?? 0;
      
      db.run(query, [data.restaurant_id, data.name, displayOrder], function(this: any, err: any) {
        if (err) {
          reject(err);
        } else {
          const lastID = this.lastID;
          // Fetch the created category
          const selectQuery = 'SELECT * FROM categories WHERE id = ?';
          db.get(selectQuery, [lastID], (err: any, row: any) => {
            if (err) reject(err);
            else resolve(row);
          });
        }
      });
    });
  }

  /**
   * Update a category
   */
  async update(categoryId: number, data: UpdateCategoryData): Promise<Category | null> {
    return new Promise((resolve, reject) => {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }
      if (data.display_order !== undefined) {
        updates.push('display_order = ?');
        values.push(data.display_order);
      }

      if (updates.length === 0) {
        // No updates, just return current category
        this.findById(categoryId).then(resolve).catch(reject);
        return;
      }

      updates.push("updated_at = datetime('now')");
      values.push(categoryId);

      const query = `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`;

      this.db.run(query, values, (err) => {
        if (err) {
          reject(err);
        } else {
          this.findById(categoryId).then(resolve).catch(reject);
        }
      });
    });
  }

  /**
   * Delete a category
   */
  async delete(categoryId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM categories WHERE id = ?';
      
      this.db.run(query, [categoryId], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  /**
   * Reorder categories - update display_order for multiple categories
   */
  async reorder(categoryOrders: Array<{ id: number; display_order: number }>): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(
        "UPDATE categories SET display_order = ?, updated_at = datetime('now') WHERE id = ?"
      );

      let error: Error | null = null;

      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');

        categoryOrders.forEach(({ id, display_order }) => {
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
   * Count dishes in a category
   */
  async countDishes(categoryId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT COUNT(*) as count FROM dishes WHERE category_id = ?';
      
      this.db.get(query, [categoryId], (err, row: any) => {
        if (err) reject(err);
        else resolve(row?.count || 0);
      });
    });
  }
}
