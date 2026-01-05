import { Database } from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';

export interface RestaurantOwner {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RestaurantOwnerWithPassword extends RestaurantOwner {
  passwordHash: string;
}

export interface CreateRestaurantOwnerData {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  passwordHash: string;
}

export class RestaurantOwnerRepository {
  constructor(private db: Database) {}

  /**
   * Create a new restaurant owner
   */
  async create(data: CreateRestaurantOwnerData): Promise<RestaurantOwner> {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const query = `
        INSERT INTO restaurant_owners (
          id, first_name, last_name, birth_date, email, password_hash
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        query,
        [
          id,
          data.firstName,
          data.lastName,
          data.birthDate,
          data.email.toLowerCase(),
          data.passwordHash
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            this.findById(id)
              .then(owner => resolve(owner!))
              .catch(reject);
          }
        }
      );
    });
  }

  /**
   * Find restaurant owner by ID (without password)
   */
  async findById(id: string): Promise<RestaurantOwner | null> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id, first_name, last_name, birth_date, email,
          created_at, updated_at
        FROM restaurant_owners 
        WHERE id = ?
      `;

      this.db.get(query, [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve(this.mapToRestaurantOwner(row));
        }
      });
    });
  }

  /**
   * Find restaurant owner by email (case-insensitive, without password)
   */
  async findByEmail(email: string): Promise<RestaurantOwner | null> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id, first_name, last_name, birth_date, email,
          created_at, updated_at
        FROM restaurant_owners 
        WHERE LOWER(email) = LOWER(?)
      `;

      this.db.get(query, [email], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve(this.mapToRestaurantOwner(row));
        }
      });
    });
  }

  /**
   * Find restaurant owner by email with password hash (for authentication)
   */
  async findByEmailWithPassword(email: string): Promise<RestaurantOwnerWithPassword | null> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id, first_name, last_name, birth_date, email, password_hash,
          created_at, updated_at
        FROM restaurant_owners 
        WHERE LOWER(email) = LOWER(?)
      `;

      this.db.get(query, [email], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            ...this.mapToRestaurantOwner(row),
            passwordHash: row.password_hash
          });
        }
      });
    });
  }

  /**
   * Update restaurant owner email
   */
  async updateEmail(id: string, email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE restaurant_owners 
        SET email = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      this.db.run(query, [email.toLowerCase(), id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Update restaurant owner password
   */
  async updatePassword(id: string, passwordHash: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE restaurant_owners 
        SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      this.db.run(query, [passwordHash, id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private mapToRestaurantOwner(row: any): RestaurantOwner {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      birthDate: row.birth_date,
      email: row.email,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
