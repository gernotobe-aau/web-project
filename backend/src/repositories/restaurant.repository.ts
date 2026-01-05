import { Database } from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  street: string;
  houseNumber: string;
  staircase?: string;
  door?: string;
  postalCode: string;
  city: string;
  contactPhone: string;
  contactEmail?: string;
  categories: string[];
  openingHours: OpeningHour[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OpeningHour {
  dayOfWeek: number;
  openTime?: string;
  closeTime?: string;
  isClosed: boolean;
}

export interface CreateRestaurantData {
  ownerId: string;
  name: string;
  address: {
    street: string;
    houseNumber: string;
    staircase?: string;
    door?: string;
    postalCode: string;
    city: string;
  };
  contactInfo: {
    phone: string;
    email?: string;
  };
  categories: string[];
  openingHours: OpeningHour[];
}

export class RestaurantRepository {
  constructor(private db: Database) {}

  /**
   * Create a new restaurant with categories and opening hours
   */
  async create(data: CreateRestaurantData): Promise<Restaurant> {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');

        // Insert restaurant
        const restaurantQuery = `
          INSERT INTO restaurants (
            id, owner_id, name, street, house_number, staircase, 
            door, postal_code, city, contact_phone, contact_email
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        this.db.run(
          restaurantQuery,
          [
            id,
            data.ownerId,
            data.name,
            data.address.street,
            data.address.houseNumber,
            data.address.staircase || null,
            data.address.door || null,
            data.address.postalCode,
            data.address.city,
            data.contactInfo.phone,
            data.contactInfo.email || null
          ],
          (err) => {
            if (err) {
              this.db.run('ROLLBACK');
              reject(err);
              return;
            }

            // Insert categories
            const categoryQuery = `
              INSERT INTO restaurant_categories (restaurant_id, category)
              VALUES (?, ?)
            `;

            let categoriesInserted = 0;
            const categoriesToInsert = data.categories.length;

            if (categoriesToInsert === 0) {
              this.db.run('ROLLBACK');
              reject(new Error('At least one category is required'));
              return;
            }

            for (const category of data.categories) {
              this.db.run(categoryQuery, [id, category], (err) => {
                if (err) {
                  this.db.run('ROLLBACK');
                  reject(err);
                  return;
                }

                categoriesInserted++;
                if (categoriesInserted === categoriesToInsert) {
                  // Insert opening hours
                  this.insertOpeningHours(id, data.openingHours)
                    .then(() => {
                      this.db.run('COMMIT', (err) => {
                        if (err) {
                          this.db.run('ROLLBACK');
                          reject(err);
                        } else {
                          this.findById(id)
                            .then(restaurant => resolve(restaurant!))
                            .catch(reject);
                        }
                      });
                    })
                    .catch(err => {
                      this.db.run('ROLLBACK');
                      reject(err);
                    });
                }
              });
            }
          }
        );
      });
    });
  }

  /**
   * Find restaurant by ID with categories and opening hours
   */
  async findById(id: string): Promise<Restaurant | null> {
    return new Promise(async (resolve, reject) => {
      const query = `
        SELECT 
          id, owner_id, name, street, house_number, staircase,
          door, postal_code, city, contact_phone, contact_email,
          created_at, updated_at
        FROM restaurants 
        WHERE id = ?
      `;

      this.db.get(query, [id], async (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          try {
            const categories = await this.getCategories(id);
            const openingHours = await this.getOpeningHours(id);
            resolve(this.mapToRestaurant(row, categories, openingHours));
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  }

  /**
   * Find restaurant by name and city (case-insensitive)
   */
  async findByNameAndCity(name: string, city: string): Promise<Restaurant | null> {
    return new Promise(async (resolve, reject) => {
      const query = `
        SELECT 
          id, owner_id, name, street, house_number, staircase,
          door, postal_code, city, contact_phone, contact_email,
          created_at, updated_at
        FROM restaurants 
        WHERE LOWER(name) = LOWER(?) AND LOWER(city) = LOWER(?)
      `;

      this.db.get(query, [name, city], async (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          try {
            const categories = await this.getCategories(row.id);
            const openingHours = await this.getOpeningHours(row.id);
            resolve(this.mapToRestaurant(row, categories, openingHours));
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  }

  /**
   * Find all restaurants by owner ID
   */
  async findByOwnerId(ownerId: string): Promise<Restaurant[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id, owner_id, name, street, house_number, staircase,
          door, postal_code, city, contact_phone, contact_email,
          created_at, updated_at
        FROM restaurants 
        WHERE owner_id = ?
      `;

      this.db.all(query, [ownerId], async (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          try {
            const restaurants = await Promise.all(
              rows.map(async (row) => {
                const categories = await this.getCategories(row.id);
                const openingHours = await this.getOpeningHours(row.id);
                return this.mapToRestaurant(row, categories, openingHours);
              })
            );
            resolve(restaurants);
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  }

  /**
   * Update restaurant contact information
   */
  async updateContactInfo(
    id: string,
    contactInfo: { phone: string; email?: string }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE restaurants 
        SET 
          contact_phone = ?,
          contact_email = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      this.db.run(query, [contactInfo.phone, contactInfo.email || null, id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Update restaurant opening hours
   */
  async updateOpeningHours(id: string, openingHours: OpeningHour[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');

        // Delete existing opening hours
        const deleteQuery = 'DELETE FROM opening_hours WHERE restaurant_id = ?';
        this.db.run(deleteQuery, [id], (err) => {
          if (err) {
            this.db.run('ROLLBACK');
            reject(err);
            return;
          }

          // Insert new opening hours
          this.insertOpeningHours(id, openingHours)
            .then(() => {
              this.db.run('COMMIT', (err) => {
                if (err) {
                  this.db.run('ROLLBACK');
                  reject(err);
                } else {
                  resolve();
                }
              });
            })
            .catch(err => {
              this.db.run('ROLLBACK');
              reject(err);
            });
        });
      });
    });
  }

  private async insertOpeningHours(restaurantId: string, openingHours: OpeningHour[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO opening_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
        VALUES (?, ?, ?, ?, ?)
      `;

      let hoursInserted = 0;
      const hoursToInsert = openingHours.length;

      if (hoursToInsert === 0) {
        resolve();
        return;
      }

      for (const hour of openingHours) {
        this.db.run(
          query,
          [
            restaurantId,
            hour.dayOfWeek,
            hour.openTime || null,
            hour.closeTime || null,
            hour.isClosed ? 1 : 0
          ],
          (err) => {
            if (err) {
              reject(err);
              return;
            }

            hoursInserted++;
            if (hoursInserted === hoursToInsert) {
              resolve();
            }
          }
        );
      }
    });
  }

  private async getCategories(restaurantId: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT category FROM restaurant_categories WHERE restaurant_id = ?';
      this.db.all(query, [restaurantId], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => row.category));
        }
      });
    });
  }

  private async getOpeningHours(restaurantId: string): Promise<OpeningHour[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT day_of_week, open_time, close_time, is_closed
        FROM opening_hours 
        WHERE restaurant_id = ?
        ORDER BY day_of_week
      `;

      this.db.all(query, [restaurantId], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            dayOfWeek: row.day_of_week,
            openTime: row.open_time,
            closeTime: row.close_time,
            isClosed: row.is_closed === 1
          })));
        }
      });
    });
  }

  private mapToRestaurant(
    row: any,
    categories: string[],
    openingHours: OpeningHour[]
  ): Restaurant {
    return {
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      street: row.street,
      houseNumber: row.house_number,
      staircase: row.staircase,
      door: row.door,
      postalCode: row.postal_code,
      city: row.city,
      contactPhone: row.contact_phone,
      contactEmail: row.contact_email,
      categories,
      openingHours,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
