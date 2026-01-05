import { Database } from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  deliveryStreet: string;
  deliveryHouseNumber: string;
  deliveryStaircase?: string;
  deliveryDoor?: string;
  deliveryPostalCode: string;
  deliveryCity: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerWithPassword extends Customer {
  passwordHash: string;
}

export interface CreateCustomerData {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  passwordHash: string;
  deliveryAddress: {
    street: string;
    houseNumber: string;
    staircase?: string;
    door?: string;
    postalCode: string;
    city: string;
  };
}

export class CustomerRepository {
  constructor(private db: Database) {}

  /**
   * Create a new customer
   */
  async create(data: CreateCustomerData): Promise<Customer> {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const query = `
        INSERT INTO customers (
          id, first_name, last_name, birth_date, email, password_hash,
          delivery_street, delivery_house_number, delivery_staircase, 
          delivery_door, delivery_postal_code, delivery_city
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        query,
        [
          id,
          data.firstName,
          data.lastName,
          data.birthDate,
          data.email.toLowerCase(),
          data.passwordHash,
          data.deliveryAddress.street,
          data.deliveryAddress.houseNumber,
          data.deliveryAddress.staircase || null,
          data.deliveryAddress.door || null,
          data.deliveryAddress.postalCode,
          data.deliveryAddress.city
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            this.findById(id)
              .then(customer => resolve(customer!))
              .catch(reject);
          }
        }
      );
    });
  }

  /**
   * Find customer by ID (without password)
   */
  async findById(id: string): Promise<Customer | null> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id, first_name, last_name, birth_date, email,
          delivery_street, delivery_house_number, delivery_staircase,
          delivery_door, delivery_postal_code, delivery_city,
          created_at, updated_at
        FROM customers 
        WHERE id = ?
      `;

      this.db.get(query, [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve(this.mapToCustomer(row));
        }
      });
    });
  }

  /**
   * Find customer by email (case-insensitive, without password)
   */
  async findByEmail(email: string): Promise<Customer | null> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id, first_name, last_name, birth_date, email,
          delivery_street, delivery_house_number, delivery_staircase,
          delivery_door, delivery_postal_code, delivery_city,
          created_at, updated_at
        FROM customers 
        WHERE LOWER(email) = LOWER(?)
      `;

      this.db.get(query, [email], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve(this.mapToCustomer(row));
        }
      });
    });
  }

  /**
   * Find customer by email with password hash (for authentication)
   */
  async findByEmailWithPassword(email: string): Promise<CustomerWithPassword | null> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id, first_name, last_name, birth_date, email, password_hash,
          delivery_street, delivery_house_number, delivery_staircase,
          delivery_door, delivery_postal_code, delivery_city,
          created_at, updated_at
        FROM customers 
        WHERE LOWER(email) = LOWER(?)
      `;

      this.db.get(query, [email], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            ...this.mapToCustomer(row),
            passwordHash: row.password_hash
          });
        }
      });
    });
  }

  /**
   * Update customer delivery address
   */
  async updateDeliveryAddress(
    id: string,
    address: {
      street: string;
      houseNumber: string;
      staircase?: string;
      door?: string;
      postalCode: string;
      city: string;
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE customers 
        SET 
          delivery_street = ?,
          delivery_house_number = ?,
          delivery_staircase = ?,
          delivery_door = ?,
          delivery_postal_code = ?,
          delivery_city = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      this.db.run(
        query,
        [
          address.street,
          address.houseNumber,
          address.staircase || null,
          address.door || null,
          address.postalCode,
          address.city,
          id
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Update customer email
   */
  async updateEmail(id: string, email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE customers 
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
   * Update customer password
   */
  async updatePassword(id: string, passwordHash: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE customers 
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

  private mapToCustomer(row: any): Customer {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      birthDate: row.birth_date,
      email: row.email,
      deliveryStreet: row.delivery_street,
      deliveryHouseNumber: row.delivery_house_number,
      deliveryStaircase: row.delivery_staircase,
      deliveryDoor: row.delivery_door,
      deliveryPostalCode: row.delivery_postal_code,
      deliveryCity: row.delivery_city,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
