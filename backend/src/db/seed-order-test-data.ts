/**
 * Seed script for Order Management testing
 * Creates test data: customers, restaurant owners, restaurants, dishes, and vouchers
 * Run with: npm run seed:orders
 */

import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import argon2 from 'argon2';
import config from '../config/config';

const DB_PATH = path.resolve(config.dbPath);

interface TestData {
  customers: Array<{ id: string; email: string; password: string }>;
  owners: Array<{ id: string; email: string; password: string }>;
  restaurants: Array<{ id: string; name: string; ownerId: string }>;
  vouchers: Array<{ code: string; description: string }>;
}

const testData: TestData = {
  customers: [],
  owners: [],
  restaurants: [],
  vouchers: []
};

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4
  });
}

async function createCustomers(db: sqlite3.Database): Promise<void> {
  console.log('Creating test customers...');

  const customers = [
    {
      firstName: 'Max',
      lastName: 'Mustermann',
      email: 'max.mustermann@test.com',
      birthDate: '1995-05-15',
      deliveryStreet: 'Teststraße',
      deliveryHouseNumber: '1',
      deliveryStaircase: null,
      deliveryDoor: null,
      deliveryPostalCode: '1010',
      deliveryCity: 'Wien'
    },
    {
      firstName: 'Anna',
      lastName: 'Schmidt',
      email: 'anna.schmidt@test.com',
      birthDate: '1998-08-22',
      deliveryStreet: 'Beispielweg',
      deliveryHouseNumber: '5',
      deliveryStaircase: '2',
      deliveryDoor: '15',
      deliveryPostalCode: '1020',
      deliveryCity: 'Wien'
    }
  ];

  const password = await hashPassword('Test1234!');

  for (const customer of customers) {
    const id = uuidv4();
    const now = new Date().toISOString();

    await new Promise<void>((resolve, reject) => {
      db.run(
        `INSERT INTO customers (
          id, first_name, last_name, birth_date, email, password_hash,
          delivery_street, delivery_house_number, delivery_staircase, delivery_door,
          delivery_postal_code, delivery_city, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, customer.firstName, customer.lastName, customer.birthDate, customer.email, password,
          customer.deliveryStreet, customer.deliveryHouseNumber, customer.deliveryStaircase, customer.deliveryDoor,
          customer.deliveryPostalCode, customer.deliveryCity, now, now
        ],
        (err) => {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              console.log(`  ↪ Customer ${customer.email} already exists (skipped)`);
              resolve();
            } else {
              reject(err);
            }
          } else {
            console.log(`  ✓ Created customer: ${customer.email}`);
            testData.customers.push({ id, email: customer.email, password: 'Test1234!' });
            resolve();
          }
        }
      );
    });
  }
}

async function createRestaurantOwners(db: sqlite3.Database): Promise<void> {
  console.log('Creating restaurant owners...');

  const owners = [
    {
      firstName: 'Mario',
      lastName: 'Rossi',
      email: 'owner@pizzamario.com',
      birthDate: '1980-03-10'
    },
    {
      firstName: 'Hans',
      lastName: 'Burger',
      email: 'owner@burgerpalace.com',
      birthDate: '1975-11-25'
    }
  ];

  const password = await hashPassword('Test1234!');

  for (const owner of owners) {
    const id = uuidv4();
    const now = new Date().toISOString();

    await new Promise<void>((resolve, reject) => {
      db.run(
        `INSERT INTO restaurant_owners (
          id, first_name, last_name, birth_date, email, password_hash, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, owner.firstName, owner.lastName, owner.birthDate, owner.email, password, now, now],
        (err) => {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              console.log(`  ↪ Owner ${owner.email} already exists (skipped)`);
              // Get existing owner ID
              db.get('SELECT id FROM restaurant_owners WHERE email = ?', [owner.email], (err, row: any) => {
                if (row) {
                  testData.owners.push({ id: row.id, email: owner.email, password: 'Test1234!' });
                }
                resolve();
              });
            } else {
              reject(err);
            }
          } else {
            console.log(`  ✓ Created owner: ${owner.email}`);
            testData.owners.push({ id, email: owner.email, password: 'Test1234!' });
            resolve();
          }
        }
      );
    });
  }
}

async function createRestaurants(db: sqlite3.Database): Promise<void> {
  console.log('Creating restaurants...');

  const restaurants = [
    {
      name: 'Pizza Mario',
      ownerEmail: 'owner@pizzamario.com',
      street: 'Kärtner Straße',
      houseNumber: '10',
      postalCode: '1010',
      city: 'Wien',
      contactPhone: '+43 1 234567',
      contactEmail: 'info@pizzamario.com',
      categories: ['italienisch', 'pizza']
    },
    {
      name: 'Burger Palace',
      ownerEmail: 'owner@burgerpalace.com',
      street: 'Mariahilfer Straße',
      houseNumber: '50',
      postalCode: '1070',
      city: 'Wien',
      contactPhone: '+43 1 345678',
      contactEmail: 'info@burgerpalace.com',
      categories: ['amerikanisch', 'burger']
    }
  ];

  for (const restaurant of restaurants) {
    const owner = testData.owners.find(o => o.email === restaurant.ownerEmail);
    if (!owner) {
      console.log(`  ⚠ Owner not found for ${restaurant.name}`);
      continue;
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await new Promise<void>((resolve, reject) => {
      db.run(
        `INSERT INTO restaurants (
          id, owner_id, name, street, house_number, staircase, door,
          postal_code, city, contact_phone, contact_email, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, owner.id, restaurant.name, restaurant.street, restaurant.houseNumber, null, null,
          restaurant.postalCode, restaurant.city, restaurant.contactPhone, restaurant.contactEmail, now, now
        ],
        async (err) => {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              console.log(`  ↪ Restaurant ${restaurant.name} already exists (skipped)`);
              // Get existing restaurant ID
              db.get('SELECT id FROM restaurants WHERE name = ? AND city = ?', [restaurant.name, restaurant.city], (err, row: any) => {
                if (row) {
                  testData.restaurants.push({ id: row.id, name: restaurant.name, ownerId: owner.id });
                }
                resolve();
              });
            } else {
              reject(err);
            }
          } else {
            console.log(`  ✓ Created restaurant: ${restaurant.name}`);
            testData.restaurants.push({ id, name: restaurant.name, ownerId: owner.id });

            // Add categories
            for (const category of restaurant.categories) {
              await new Promise<void>((res, rej) => {
                db.run(
                  'INSERT INTO restaurant_categories (restaurant_id, category) VALUES (?, ?)',
                  [id, category],
                  (err) => {
                    if (err && !err.message.includes('UNIQUE')) rej(err);
                    else res();
                  }
                );
              });
            }

            // Add opening hours (Mo-So 11:00-22:00 for Pizza Mario, 12:00-23:00 for Burger Palace)
            const openTime = restaurant.name === 'Pizza Mario' ? '11:00' : '12:00';
            const closeTime = restaurant.name === 'Pizza Mario' ? '22:00' : '23:00';

            for (let day = 0; day <= 6; day++) {
              await new Promise<void>((res, rej) => {
                db.run(
                  'INSERT INTO opening_hours (restaurant_id, day_of_week, open_time, close_time, is_closed) VALUES (?, ?, ?, ?, 0)',
                  [id, day, openTime, closeTime],
                  (err) => {
                    if (err && !err.message.includes('UNIQUE')) rej(err);
                    else res();
                  }
                );
              });
            }

            resolve();
          }
        }
      );
    });
  }
}

async function createDishes(db: sqlite3.Database): Promise<void> {
  console.log('Creating dishes and categories...');

  const pizzaMario = testData.restaurants.find(r => r.name === 'Pizza Mario');
  const burgerPalace = testData.restaurants.find(r => r.name === 'Burger Palace');

  if (!pizzaMario || !burgerPalace) {
    console.log('  ⚠ Restaurants not found, skipping dishes');
    return;
  }

  // Create categories
  const categories = [
    { restaurantId: pizzaMario.id, name: 'Pizzen', displayOrder: 1 },
    { restaurantId: pizzaMario.id, name: 'Pasta', displayOrder: 2 },
    { restaurantId: burgerPalace.id, name: 'Burgers', displayOrder: 1 }
  ];

  const categoryIds: { [key: string]: number } = {};

  for (const category of categories) {
    await new Promise<void>((resolve, reject) => {
      db.run(
        'INSERT INTO categories (restaurant_id, name, display_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [category.restaurantId, category.name, category.displayOrder, new Date().toISOString(), new Date().toISOString()],
        function (err) {
          if (err) {
            if (err.message.includes('UNIQUE')) {
              console.log(`  ↪ Category ${category.name} already exists`);
              // Get existing category ID
              db.get(
                'SELECT id FROM categories WHERE restaurant_id = ? AND name = ?',
                [category.restaurantId, category.name],
                (err, row: any) => {
                  if (row) {
                    categoryIds[`${category.restaurantId}-${category.name}`] = row.id;
                  }
                  resolve();
                }
              );
            } else {
              reject(err);
            }
          } else {
            console.log(`  ✓ Created category: ${category.name}`);
            categoryIds[`${category.restaurantId}-${category.name}`] = this.lastID;
            resolve();
          }
        }
      );
    });
  }

  // Create dishes
  const dishes = [
    {
      restaurantId: pizzaMario.id,
      categoryName: 'Pizzen',
      name: 'Pizza Margherita',
      description: 'Klassische Pizza mit Tomatensauce und Mozzarella',
      price: 8.00,
      cookingTimeMinutes: 15,
      displayOrder: 1
    },
    {
      restaurantId: pizzaMario.id,
      categoryName: 'Pizzen',
      name: 'Pizza Salami',
      description: 'Pizza mit Salami',
      price: 10.00,
      cookingTimeMinutes: 15,
      displayOrder: 2
    },
    {
      restaurantId: pizzaMario.id,
      categoryName: 'Pasta',
      name: 'Spaghetti Carbonara',
      description: 'Spaghetti mit Ei, Speck und Parmesan',
      price: 12.00,
      cookingTimeMinutes: 20,
      displayOrder: 1
    },
    {
      restaurantId: burgerPalace.id,
      categoryName: 'Burgers',
      name: 'Classic Cheeseburger',
      description: 'Beef Patty mit Käse, Salat und Tomaten',
      price: 9.00,
      cookingTimeMinutes: 10,
      displayOrder: 1
    }
  ];

  for (const dish of dishes) {
    const categoryId = categoryIds[`${dish.restaurantId}-${dish.categoryName}`];
    
    await new Promise<void>((resolve, reject) => {
      db.run(
        `INSERT INTO dishes (
          restaurant_id, category_id, name, description, price, 
          cooking_time_minutes, display_order, photo_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dish.restaurantId, categoryId, dish.name, dish.description, dish.price,
          dish.cookingTimeMinutes, dish.displayOrder, null, 
          new Date().toISOString(), new Date().toISOString()
        ],
        (err) => {
          if (err) {
            if (err.message.includes('UNIQUE')) {
              console.log(`  ↪ Dish ${dish.name} already exists (skipped)`);
              resolve();
            } else {
              reject(err);
            }
          } else {
            console.log(`  ✓ Created dish: ${dish.name}`);
            resolve();
          }
        }
      );
    });
  }
}

async function createVouchers(db: sqlite3.Database): Promise<void> {
  console.log('Creating vouchers...');

  const pizzaMario = testData.restaurants.find(r => r.name === 'Pizza Mario');

  const vouchers = [
    {
      code: 'WELCOME10',
      discountType: 'percentage',
      discountValue: 10,
      isActive: 1,
      validFrom: '2024-01-01T00:00:00.000Z',
      validUntil: '2030-12-31T23:59:59.000Z',
      usageLimit: null,
      restaurantId: null,
      description: '10% global discount, unlimited usage'
    },
    {
      code: 'MARIO20',
      discountType: 'percentage',
      discountValue: 20,
      isActive: 1,
      validFrom: '2024-01-01T00:00:00.000Z',
      validUntil: '2030-12-31T23:59:59.000Z',
      usageLimit: 5,
      restaurantId: pizzaMario?.id || null,
      description: '20% discount for Pizza Mario only, limit 5 uses'
    },
    {
      code: 'EXPIRED2025',
      discountType: 'fixed_amount',
      discountValue: 5,
      isActive: 1,
      validFrom: '2024-01-01T00:00:00.000Z',
      validUntil: '2025-01-01T00:00:00.000Z',
      usageLimit: null,
      restaurantId: null,
      description: '5€ discount, expired'
    }
  ];

  for (const voucher of vouchers) {
    await new Promise<void>((resolve, reject) => {
      const now = new Date().toISOString();
      db.run(
        `INSERT INTO vouchers (
          code, discount_type, discount_value, is_active,
          valid_from, valid_until, usage_limit, usage_count,
          restaurant_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
        [
          voucher.code, voucher.discountType, voucher.discountValue, voucher.isActive,
          voucher.validFrom, voucher.validUntil, voucher.usageLimit,
          voucher.restaurantId, now, now
        ],
        (err) => {
          if (err) {
            if (err.message.includes('UNIQUE')) {
              console.log(`  ↪ Voucher ${voucher.code} already exists (skipped)`);
              resolve();
            } else {
              reject(err);
            }
          } else {
            console.log(`  ✓ Created voucher: ${voucher.code} - ${voucher.description}`);
            testData.vouchers.push({ code: voucher.code, description: voucher.description });
            resolve();
          }
        }
      );
    });
  }
}

function printSummary(): void {
  console.log('\n' + '='.repeat(80));
  console.log('ORDER MANAGEMENT TEST DATA - SUMMARY');
  console.log('='.repeat(80));

  console.log('\nCUSTOMERS:');
  testData.customers.forEach(c => {
    console.log(`  📧 ${c.email.padEnd(30)} | Password: ${c.password}`);
  });

  console.log('\nRESTAURANT OWNERS:');
  testData.owners.forEach(o => {
    console.log(`  📧 ${o.email.padEnd(30)} | Password: ${o.password}`);
  });

  console.log('\nRESTAURANTS:');
  testData.restaurants.forEach(r => {
    console.log(`  🏪 ${r.name}`);
  });

  console.log('\nVOUCHERS:');
  testData.vouchers.forEach(v => {
    console.log(`  🎟️  ${v.code.padEnd(15)} - ${v.description}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('Test data seeding completed successfully!');
  console.log('You can now use these credentials to test the Order Management API.');
  console.log('='.repeat(80) + '\n');
}

async function main(): Promise<void> {
  console.log('Starting Order Management test data seeding...\n');

  const db = new sqlite3.Database(DB_PATH);

  try {
    // Enable foreign keys
    await new Promise<void>((resolve, reject) => {
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await createCustomers(db);
    await createRestaurantOwners(db);
    await createRestaurants(db);
    await createDishes(db);
    await createVouchers(db);

    printSummary();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
