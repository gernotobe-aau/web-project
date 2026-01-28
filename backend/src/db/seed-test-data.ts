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
      deliveryStreet: 'Widmanngasse',
      deliveryHouseNumber: '12',
      deliveryStaircase: null,
      deliveryDoor: null,
      deliveryPostalCode: '9500',
      deliveryCity: 'Villach'
    },
    {
      firstName: 'Anna',
      lastName: 'Schmidt',
      email: 'anna.schmidt@test.com',
      birthDate: '1998-08-22',
      deliveryStreet: 'Peraustraße',
      deliveryHouseNumber: '45',
      deliveryStaircase: '2',
      deliveryDoor: '15',
      deliveryPostalCode: '9500',
      deliveryCity: 'Villach'
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
              // Load existing customer ID
              db.get('SELECT id FROM customers WHERE email = ?', [customer.email], (err, row: any) => {
                if (row) {
                  testData.customers.push({ id: row.id, email: customer.email, password: 'Test1234!' });
                }
                resolve();
              });
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
    },
    {
      firstName: 'Yuki',
      lastName: 'Tanaka',
      email: 'owner@sushidreams.com',
      birthDate: '1985-07-15'
    },
    {
      firstName: 'Raj',
      lastName: 'Patel',
      email: 'owner@tajmahal.com',
      birthDate: '1978-04-20'
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
      street: 'Hauptplatz',
      houseNumber: '12',
      postalCode: '9500',
      city: 'Villach',
      contactPhone: '+43 4242 234567',
      contactEmail: 'info@pizzamario.com',
      categories: ['italienisch', 'pizza']
    },
    {
      name: 'Burger Palace',
      ownerEmail: 'owner@burgerpalace.com',
      street: 'Italiener Straße',
      houseNumber: '25',
      postalCode: '9500',
      city: 'Villach',
      contactPhone: '+43 4242 345678',
      contactEmail: 'info@burgerpalace.com',
      categories: ['amerikanisch', 'burger']
    },
    {
      name: 'Sushi Dreams',
      ownerEmail: 'owner@sushidreams.com',
      street: 'Bahnhofstraße',
      houseNumber: '8',
      postalCode: '9500',
      city: 'Villach',
      contactPhone: '+43 4242 456789',
      contactEmail: 'info@sushidreams.com',
      categories: ['asiatisch', 'sushi']
    },
    {
      name: 'Taj Mahal',
      ownerEmail: 'owner@tajmahal.com',
      street: 'Klagenfurter Straße',
      houseNumber: '45',
      postalCode: '9500',
      city: 'Villach',
      contactPhone: '+43 4242 567890',
      contactEmail: 'info@tajmahal.com',
      categories: ['indisch', 'vegetarisch']
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
  const sushiDreams = testData.restaurants.find(r => r.name === 'Sushi Dreams');
  const tajMahal = testData.restaurants.find(r => r.name === 'Taj Mahal');

  if (!pizzaMario || !burgerPalace || !sushiDreams || !tajMahal) {
    console.log('  ⚠ Restaurants not found, skipping dishes');
    return;
  }

  // Create categories
  const categories = [
    // Pizza Mario
    { restaurantId: pizzaMario.id, name: 'Pizzen', displayOrder: 1 },
    { restaurantId: pizzaMario.id, name: 'Pasta', displayOrder: 2 },
    { restaurantId: pizzaMario.id, name: 'Salate', displayOrder: 3 },
    { restaurantId: pizzaMario.id, name: 'Desserts', displayOrder: 4 },
    
    // Burger Palace
    { restaurantId: burgerPalace.id, name: 'Burgers', displayOrder: 1 },
    { restaurantId: burgerPalace.id, name: 'Sides', displayOrder: 2 },
    { restaurantId: burgerPalace.id, name: 'Salads', displayOrder: 3 },
    { restaurantId: burgerPalace.id, name: 'Shakes', displayOrder: 4 },
    
    // Sushi Dreams
    { restaurantId: sushiDreams.id, name: 'Nigiri', displayOrder: 1 },
    { restaurantId: sushiDreams.id, name: 'Maki', displayOrder: 2 },
    { restaurantId: sushiDreams.id, name: 'Ramen', displayOrder: 3 },
    
    // Taj Mahal
    { restaurantId: tajMahal.id, name: 'Curry', displayOrder: 1 },
    { restaurantId: tajMahal.id, name: 'Tandoori', displayOrder: 2 },
    { restaurantId: tajMahal.id, name: 'Beilagen', displayOrder: 3 },
    { restaurantId: tajMahal.id, name: 'Getränke', displayOrder: 4 }
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
    // Pizza Mario - Pizzen
    { restaurantId: pizzaMario.id, categoryName: 'Pizzen', name: 'Pizza Margherita', description: 'Klassische Pizza mit Tomatensauce und Mozzarella', price: 8.50, cookingTimeMinutes: 15, displayOrder: 1 },
    { restaurantId: pizzaMario.id, categoryName: 'Pizzen', name: 'Pizza Salami', description: 'Mit italienischer Salami', price: 10.00, cookingTimeMinutes: 15, displayOrder: 2 },
    { restaurantId: pizzaMario.id, categoryName: 'Pizzen', name: 'Pizza Prosciutto', description: 'Mit Schinken und Champignons', price: 11.00, cookingTimeMinutes: 15, displayOrder: 3 },
    { restaurantId: pizzaMario.id, categoryName: 'Pizzen', name: 'Pizza Quattro Formaggi', description: 'Vier Käsesorten: Mozzarella, Gorgonzola, Parmesan, Emmentaler', price: 12.50, cookingTimeMinutes: 18, displayOrder: 4 },
    { restaurantId: pizzaMario.id, categoryName: 'Pizzen', name: 'Pizza Diavola', description: 'Scharfe Salami, Peperoni, Chili', price: 11.50, cookingTimeMinutes: 15, displayOrder: 5 },
    
    // Pizza Mario - Pasta
    { restaurantId: pizzaMario.id, categoryName: 'Pasta', name: 'Spaghetti Carbonara', description: 'Mit Ei, Speck und Parmesan', price: 12.00, cookingTimeMinutes: 20, displayOrder: 1 },
    { restaurantId: pizzaMario.id, categoryName: 'Pasta', name: 'Penne Arrabiata', description: 'Scharfe Tomatensauce mit Knoblauch', price: 10.50, cookingTimeMinutes: 18, displayOrder: 2 },
    { restaurantId: pizzaMario.id, categoryName: 'Pasta', name: 'Lasagne Bolognese', description: 'Klassische Lasagne mit Hackfleischsauce', price: 13.50, cookingTimeMinutes: 25, displayOrder: 3 },
    { restaurantId: pizzaMario.id, categoryName: 'Pasta', name: 'Tagliatelle al Salmone', description: 'Bandnudeln mit Lachs in Sahnesauce', price: 15.00, cookingTimeMinutes: 20, displayOrder: 4 },
    
    // Pizza Mario - Salate
    { restaurantId: pizzaMario.id, categoryName: 'Salate', name: 'Insalata Mista', description: 'Gemischter Salat mit Balsamico-Dressing', price: 6.50, cookingTimeMinutes: 5, displayOrder: 1 },
    { restaurantId: pizzaMario.id, categoryName: 'Salate', name: 'Caesar Salad', description: 'Römersalat mit Parmesan und Croûtons', price: 9.00, cookingTimeMinutes: 8, displayOrder: 2 },
    
    // Pizza Mario - Desserts
    { restaurantId: pizzaMario.id, categoryName: 'Desserts', name: 'Tiramisu', description: 'Klassisches italienisches Dessert', price: 6.00, cookingTimeMinutes: 1, displayOrder: 1 },
    { restaurantId: pizzaMario.id, categoryName: 'Desserts', name: 'Panna Cotta', description: 'Mit Erdbeersauce', price: 5.50, cookingTimeMinutes: 1, displayOrder: 2 },
    
    // Burger Palace - Burgers
    { restaurantId: burgerPalace.id, categoryName: 'Burgers', name: 'Classic Cheeseburger', description: 'Beef Patty mit Käse, Salat und Tomaten', price: 9.50, cookingTimeMinutes: 12, displayOrder: 1 },
    { restaurantId: burgerPalace.id, categoryName: 'Burgers', name: 'Bacon Burger', description: 'Mit knusprigem Bacon und BBQ-Sauce', price: 11.00, cookingTimeMinutes: 15, displayOrder: 2 },
    { restaurantId: burgerPalace.id, categoryName: 'Burgers', name: 'Double Whopper', description: 'Doppeltes Beef Patty, doppelter Käse', price: 13.50, cookingTimeMinutes: 18, displayOrder: 3 },
    { restaurantId: burgerPalace.id, categoryName: 'Burgers', name: 'Veggie Burger', description: 'Vegetarisches Patty mit Avocado', price: 10.00, cookingTimeMinutes: 12, displayOrder: 4 },
    { restaurantId: burgerPalace.id, categoryName: 'Burgers', name: 'Chicken Burger', description: 'Knuspriges Hähnchenfilet mit Mayo', price: 10.50, cookingTimeMinutes: 15, displayOrder: 5 },
    
    // Burger Palace - Sides
    { restaurantId: burgerPalace.id, categoryName: 'Sides', name: 'French Fries', description: 'Klassische Pommes Frites', price: 4.00, cookingTimeMinutes: 8, displayOrder: 1 },
    { restaurantId: burgerPalace.id, categoryName: 'Sides', name: 'Sweet Potato Fries', description: 'Süßkartoffel Pommes', price: 5.00, cookingTimeMinutes: 10, displayOrder: 2 },
    { restaurantId: burgerPalace.id, categoryName: 'Sides', name: 'Onion Rings', description: 'Frittierte Zwiebelringe', price: 4.50, cookingTimeMinutes: 8, displayOrder: 3 },
    { restaurantId: burgerPalace.id, categoryName: 'Sides', name: 'Coleslaw', description: 'Krautsalat', price: 3.50, cookingTimeMinutes: 1, displayOrder: 4 },
    
    // Burger Palace - Salads
    { restaurantId: burgerPalace.id, categoryName: 'Salads', name: 'Garden Salad', description: 'Frischer Gartensalat', price: 7.00, cookingTimeMinutes: 5, displayOrder: 1 },
    { restaurantId: burgerPalace.id, categoryName: 'Salads', name: 'Chicken Caesar', description: 'Mit gegrilltem Hähnchen', price: 10.50, cookingTimeMinutes: 10, displayOrder: 2 },
    
    // Burger Palace - Shakes
    { restaurantId: burgerPalace.id, categoryName: 'Shakes', name: 'Vanilla Shake', description: 'Cremiger Vanille-Milchshake', price: 5.00, cookingTimeMinutes: 3, displayOrder: 1 },
    { restaurantId: burgerPalace.id, categoryName: 'Shakes', name: 'Chocolate Shake', description: 'Schokoladen-Milchshake', price: 5.00, cookingTimeMinutes: 3, displayOrder: 2 },
    { restaurantId: burgerPalace.id, categoryName: 'Shakes', name: 'Strawberry Shake', description: 'Erdbeer-Milchshake', price: 5.50, cookingTimeMinutes: 3, displayOrder: 3 },
    
    // Sushi Dreams - Nigiri
    { restaurantId: sushiDreams.id, categoryName: 'Nigiri', name: 'Sake Nigiri', description: 'Lachs Nigiri (2 Stück)', price: 5.50, cookingTimeMinutes: 5, displayOrder: 1 },
    { restaurantId: sushiDreams.id, categoryName: 'Nigiri', name: 'Maguro Nigiri', description: 'Thunfisch Nigiri (2 Stück)', price: 6.00, cookingTimeMinutes: 5, displayOrder: 2 },
    { restaurantId: sushiDreams.id, categoryName: 'Nigiri', name: 'Ebi Nigiri', description: 'Garnelen Nigiri (2 Stück)', price: 5.00, cookingTimeMinutes: 5, displayOrder: 3 },
    { restaurantId: sushiDreams.id, categoryName: 'Nigiri', name: 'Unagi Nigiri', description: 'Aal Nigiri (2 Stück)', price: 7.00, cookingTimeMinutes: 5, displayOrder: 4 },
    
    // Sushi Dreams - Maki
    { restaurantId: sushiDreams.id, categoryName: 'Maki', name: 'California Roll', description: 'Mit Surimi, Avocado und Gurke (8 Stück)', price: 9.00, cookingTimeMinutes: 10, displayOrder: 1 },
    { restaurantId: sushiDreams.id, categoryName: 'Maki', name: 'Spicy Tuna Roll', description: 'Scharfer Thunfisch (8 Stück)', price: 10.50, cookingTimeMinutes: 10, displayOrder: 2 },
    { restaurantId: sushiDreams.id, categoryName: 'Maki', name: 'Rainbow Roll', description: 'Mit verschiedenen Fischsorten (8 Stück)', price: 12.00, cookingTimeMinutes: 12, displayOrder: 3 },
    { restaurantId: sushiDreams.id, categoryName: 'Maki', name: 'Veggie Roll', description: 'Vegetarisch mit Avocado, Gurke, Karotte (8 Stück)', price: 7.50, cookingTimeMinutes: 10, displayOrder: 4 },
    { restaurantId: sushiDreams.id, categoryName: 'Maki', name: 'Dragon Roll', description: 'Mit Aal und Avocado (8 Stück)', price: 13.00, cookingTimeMinutes: 15, displayOrder: 5 },
    
    // Sushi Dreams - Ramen
    { restaurantId: sushiDreams.id, categoryName: 'Ramen', name: 'Shoyu Ramen', description: 'Klassische Soja-Ramen mit Schweinebrühe', price: 13.50, cookingTimeMinutes: 20, displayOrder: 1 },
    { restaurantId: sushiDreams.id, categoryName: 'Ramen', name: 'Miso Ramen', description: 'Mit Miso-Paste und Tofu', price: 12.50, cookingTimeMinutes: 20, displayOrder: 2 },
    { restaurantId: sushiDreams.id, categoryName: 'Ramen', name: 'Tonkotsu Ramen', description: 'Cremige Schweineknochenbrühe', price: 14.50, cookingTimeMinutes: 25, displayOrder: 3 },
    
    // Taj Mahal - Curry
    { restaurantId: tajMahal.id, categoryName: 'Curry', name: 'Chicken Tikka Masala', description: 'Hähnchen in Tomaten-Sahne-Sauce', price: 14.50, cookingTimeMinutes: 25, displayOrder: 1 },
    { restaurantId: tajMahal.id, categoryName: 'Curry', name: 'Lamb Vindaloo', description: 'Scharfes Lamm-Curry', price: 16.00, cookingTimeMinutes: 30, displayOrder: 2 },
    { restaurantId: tajMahal.id, categoryName: 'Curry', name: 'Palak Paneer', description: 'Spinat mit indischem Käse', price: 12.50, cookingTimeMinutes: 20, displayOrder: 3 },
    { restaurantId: tajMahal.id, categoryName: 'Curry', name: 'Butter Chicken', description: 'Hähnchen in cremiger Buttersauce', price: 15.00, cookingTimeMinutes: 25, displayOrder: 4 },
    { restaurantId: tajMahal.id, categoryName: 'Curry', name: 'Chana Masala', description: 'Würzige Kichererbsen (vegan)', price: 11.00, cookingTimeMinutes: 20, displayOrder: 5 },
    
    // Taj Mahal - Tandoori
    { restaurantId: tajMahal.id, categoryName: 'Tandoori', name: 'Tandoori Chicken', description: 'Im Lehmofen gegrilltes Hähnchen', price: 13.50, cookingTimeMinutes: 30, displayOrder: 1 },
    { restaurantId: tajMahal.id, categoryName: 'Tandoori', name: 'Seekh Kabab', description: 'Würzige Lammspieße', price: 15.00, cookingTimeMinutes: 25, displayOrder: 2 },
    { restaurantId: tajMahal.id, categoryName: 'Tandoori', name: 'Paneer Tikka', description: 'Gegrillter indischer Käse', price: 11.50, cookingTimeMinutes: 20, displayOrder: 3 },
    
    // Taj Mahal - Beilagen
    { restaurantId: tajMahal.id, categoryName: 'Beilagen', name: 'Basmati Reis', description: 'Gedämpfter Basmati-Reis', price: 3.50, cookingTimeMinutes: 15, displayOrder: 1 },
    { restaurantId: tajMahal.id, categoryName: 'Beilagen', name: 'Naan Brot', description: 'Frisches Fladenbrot aus dem Tandoor', price: 3.00, cookingTimeMinutes: 8, displayOrder: 2 },
    { restaurantId: tajMahal.id, categoryName: 'Beilagen', name: 'Garlic Naan', description: 'Naan mit Knoblauch', price: 3.50, cookingTimeMinutes: 8, displayOrder: 3 },
    { restaurantId: tajMahal.id, categoryName: 'Beilagen', name: 'Raita', description: 'Joghurt mit Gurke und Minze', price: 4.00, cookingTimeMinutes: 1, displayOrder: 4 },
    
    // Taj Mahal - Getränke
    { restaurantId: tajMahal.id, categoryName: 'Getränke', name: 'Mango Lassi', description: 'Joghurt-Drink mit Mango', price: 4.50, cookingTimeMinutes: 3, displayOrder: 1 },
    { restaurantId: tajMahal.id, categoryName: 'Getränke', name: 'Masala Chai', description: 'Gewürzter indischer Tee', price: 3.50, cookingTimeMinutes: 5, displayOrder: 2 }
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

async function createSampleOrders(db: sqlite3.Database): Promise<void> {
  console.log('Creating sample orders...');

  const burgerPalace = testData.restaurants.find(r => r.name === 'Burger Palace');
  const customer1 = testData.customers.find(c => c.email === 'max.mustermann@test.com');
  const customer2 = testData.customers.find(c => c.email === 'anna.schmidt@test.com');

  if (!burgerPalace || !customer1 || !customer2) {
    console.log('  ⚠ Required data not found, skipping sample orders');
    return;
  }

  // Get dish IDs for Burger Palace
  const getDishId = (name: string): Promise<number | null> => {
    return new Promise((resolve) => {
      db.get(
        'SELECT id FROM dishes WHERE restaurant_id = ? AND name = ?',
        [burgerPalace.id, name],
        (err, row: any) => {
          if (err || !row) resolve(null);
          else resolve(row.id);
        }
      );
    });
  };

  const cheeseburger = await getDishId('Classic Cheeseburger');
  const baconBurger = await getDishId('Bacon Burger');
  const fries = await getDishId('French Fries');
  const shake = await getDishId('Vanilla Shake');
  const veggiBurger = await getDishId('Veggie Burger');
  const sweetPotatoFries = await getDishId('Sweet Potato Fries');

  if (!cheeseburger || !fries) {
    console.log('  ⚠ Required dishes not found, skipping sample orders');
    return;
  }

  const now = new Date();

  // Helper function to create order with items
  const createOrder = async (orderData: {
    customerId: string;
    items: Array<{ dishId: number; dishName: string; dishPrice: number; quantity: number }>;
    status: string;
    createdAt: Date;
    acceptedAt?: Date;
    preparingStartedAt?: Date;
    readyAt?: Date;
    deliveringStartedAt?: Date;
    deliveredAt?: Date;
    dailyOrderNumber?: number;
  }) => {
    const orderId = uuidv4();
    const subtotal = orderData.items.reduce((sum, item) => sum + item.dishPrice * item.quantity, 0);
    const finalPrice = Math.round(subtotal * 100) / 100;
    const orderDate = orderData.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD

    // Get customer address
    const customerAddress: any = await new Promise((resolve) => {
      db.get(
        'SELECT street, house_number, staircase, door, postal_code, city FROM customers WHERE id = ?',
        [orderData.customerId],
        (err, row) => resolve(row || {})
      );
    });
    
    // Get next daily order number if not provided
    const dailyOrderNumber = orderData.dailyOrderNumber || await new Promise<number>((resolve) => {
      db.get(
        'SELECT COALESCE(MAX(daily_order_number), 0) + 1 as next_num FROM orders WHERE restaurant_id = ? AND order_date = ?',
        [burgerPalace.id, orderDate],
        (err, row: any) => resolve(row?.next_num || 1)
      );
    });

    await new Promise<void>((resolve, reject) => {
      db.run(
        `INSERT INTO orders (
          id, customer_id, restaurant_id, order_status, 
          daily_order_number, order_date,
          subtotal, discount_amount, final_price,
          delivery_street, delivery_house_number, delivery_staircase, delivery_door,
          delivery_postal_code, delivery_city, estimated_delivery_minutes,
          created_at, updated_at, accepted_at, preparing_started_at, ready_at,
          delivering_started_at, delivered_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId, orderData.customerId, burgerPalace.id, orderData.status,
          dailyOrderNumber, orderDate,
          subtotal, 0, finalPrice,
          customerAddress.street || 'Teststraße',
          customerAddress.house_number || '1',
          customerAddress.staircase,
          customerAddress.door,
          customerAddress.postal_code || '1010',
          customerAddress.city || 'Wien',
          30,
          orderData.createdAt.toISOString(),
          orderData.createdAt.toISOString(),
          orderData.acceptedAt?.toISOString(),
          orderData.preparingStartedAt?.toISOString(),
          orderData.readyAt?.toISOString(),
          orderData.deliveringStartedAt?.toISOString(),
          orderData.deliveredAt?.toISOString()
        ],
        async (err) => {
          if (err) return reject(err);

          // Create order items
          for (const item of orderData.items) {
            const itemSubtotal = Math.round(item.dishPrice * item.quantity * 100) / 100;
            await new Promise<void>((res, rej) => {
              db.run(
                `INSERT INTO order_items (
                  order_id, dish_id, dish_name, dish_price, quantity, subtotal, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [orderId, item.dishId, item.dishName, item.dishPrice, item.quantity, itemSubtotal, orderData.createdAt.toISOString()],
                (err) => (err ? rej(err) : res())
              );
            });
          }

          // Create status history entries
          const statusHistory = [
            { status: 'pending', timestamp: orderData.createdAt }
          ];
          
          if (orderData.acceptedAt) {
            statusHistory.push({ status: 'accepted', timestamp: orderData.acceptedAt });
          }
          if (orderData.preparingStartedAt) {
            statusHistory.push({ status: 'preparing', timestamp: orderData.preparingStartedAt });
          }
          if (orderData.readyAt) {
            statusHistory.push({ status: 'ready', timestamp: orderData.readyAt });
          }
          if (orderData.deliveringStartedAt) {
            statusHistory.push({ status: 'delivering', timestamp: orderData.deliveringStartedAt });
          }
          if (orderData.deliveredAt) {
            statusHistory.push({ status: 'delivered', timestamp: orderData.deliveredAt });
          }

          for (const entry of statusHistory) {
            await new Promise<void>((res, rej) => {
              db.run(
                'INSERT INTO order_status_history (order_id, status, changed_at) VALUES (?, ?, ?)',
                [orderId, entry.status, entry.timestamp.toISOString()],
                (err) => (err ? rej(err) : res())
              );
            });
          }

          resolve();
        }
      );
    });

    return orderId;
  };

  // Order 1: Delivered order from ~3 hours ago (16:00-17:00)
  const order1Time = new Date(now);
  order1Time.setHours(16, 30, 0, 0);
  const order1Accepted = new Date(order1Time.getTime() + 2 * 60 * 1000); // +2 min
  const order1Preparing = new Date(order1Accepted.getTime() + 3 * 60 * 1000); // +3 min
  const order1Ready = new Date(order1Preparing.getTime() + 15 * 60 * 1000); // +15 min
  const order1Delivering = new Date(order1Ready.getTime() + 2 * 60 * 1000); // +2 min
  const order1Delivered = new Date(order1Delivering.getTime() + 25 * 60 * 1000); // +25 min

  await createOrder({
    customerId: customer1!.id,
    items: [
      { dishId: cheeseburger, dishName: 'Classic Cheeseburger', dishPrice: 9.50, quantity: 2 },
      { dishId: fries, dishName: 'French Fries', dishPrice: 4.00, quantity: 2 },
      { dishId: shake!, dishName: 'Vanilla Shake', dishPrice: 5.00, quantity: 1 }
    ],
    status: 'delivered',
    createdAt: order1Time,
    acceptedAt: order1Accepted,
    preparingStartedAt: order1Preparing,
    readyAt: order1Ready,
    deliveringStartedAt: order1Delivering,
    deliveredAt: order1Delivered
  });
  console.log('  ✓ Created delivered order (16:30)');

  // Order 2: Delivered order from ~2.5 hours ago (17:00)
  const order2Time = new Date(now);
  order2Time.setHours(17, 0, 0, 0);
  const order2Accepted = new Date(order2Time.getTime() + 1 * 60 * 1000);
  const order2Preparing = new Date(order2Accepted.getTime() + 2 * 60 * 1000);
  const order2Ready = new Date(order2Preparing.getTime() + 12 * 60 * 1000);
  const order2Delivering = new Date(order2Ready.getTime() + 1 * 60 * 1000);
  const order2Delivered = new Date(order2Delivering.getTime() + 20 * 60 * 1000);

  if (baconBurger) {
    await createOrder({
      customerId: customer2!.id,
      items: [
        { dishId: baconBurger, dishName: 'Bacon Burger', dishPrice: 11.00, quantity: 1 },
        { dishId: sweetPotatoFries!, dishName: 'Sweet Potato Fries', dishPrice: 5.00, quantity: 1 }
      ],
      status: 'delivered',
      createdAt: order2Time,
      acceptedAt: order2Accepted,
      preparingStartedAt: order2Preparing,
      readyAt: order2Ready,
      deliveringStartedAt: order2Delivering,
      deliveredAt: order2Delivered
    });
    console.log('  ✓ Created delivered order (17:00)');
  }

  // Order 3: Accepted order from ~15 minutes ago
  const order3Time = new Date(now.getTime() - 15 * 60 * 1000);
  const order3Accepted = new Date(order3Time.getTime() + 3 * 60 * 1000);
  const order3Preparing = new Date(order3Accepted.getTime() + 2 * 60 * 1000);

  if (veggiBurger) {
    await createOrder({
      customerId: customer1!.id,
      items: [
        { dishId: veggiBurger, dishName: 'Veggie Burger', dishPrice: 10.00, quantity: 1 },
        { dishId: fries, dishName: 'French Fries', dishPrice: 4.00, quantity: 1 }
      ],
      status: 'preparing',
      createdAt: order3Time,
      acceptedAt: order3Accepted,
      preparingStartedAt: order3Preparing
    });
    console.log('  ✓ Created preparing order (15 min ago)');
  }

  // Order 4: New pending order from ~5 minutes ago
  const order4Time = new Date(now.getTime() - 5 * 60 * 1000);

  await createOrder({
    customerId: customer2!.id,
    items: [
      { dishId: cheeseburger, dishName: 'Classic Cheeseburger', dishPrice: 9.50, quantity: 1 },
      { dishId: shake!, dishName: 'Vanilla Shake', dishPrice: 5.00, quantity: 1 }
    ],
    status: 'pending',
    createdAt: order4Time
  });
  console.log('  ✓ Created pending order (5 min ago)');

  // Order 5: Very new pending order from ~1 minute ago
  const order5Time = new Date(now.getTime() - 1 * 60 * 1000);

  if (baconBurger) {
    await createOrder({
      customerId: customer1!.id,
      items: [
        { dishId: baconBurger, dishName: 'Bacon Burger', dishPrice: 11.00, quantity: 2 },
        { dishId: fries, dishName: 'French Fries', dishPrice: 4.00, quantity: 2 },
        { dishId: shake!, dishName: 'Vanilla Shake', dishPrice: 5.00, quantity: 2 }
      ],
      status: 'pending',
      createdAt: order5Time
    });
    console.log('  ✓ Created pending order (1 min ago)');
  }

  // ==========================================
  // ORDERS FROM LAST WEEK (for analytics)
  // ==========================================
  console.log('Creating orders from last week for analytics...');

  // Order from 5 days ago - delivered
  const lastWeekOrder1 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  await createOrder({
    customerId: customer2!.id,
    items: [
      { dishId: cheeseburger, dishName: 'Classic Cheeseburger', dishPrice: 9.50, quantity: 2 },
      { dishId: fries, dishName: 'French Fries', dishPrice: 4.00, quantity: 2 }
    ],
    status: 'delivered',
    createdAt: lastWeekOrder1,
    acceptedAt: new Date(lastWeekOrder1.getTime() + 2 * 60 * 1000),
    preparingStartedAt: new Date(lastWeekOrder1.getTime() + 5 * 60 * 1000),
    readyAt: new Date(lastWeekOrder1.getTime() + 25 * 60 * 1000),
    deliveringStartedAt: new Date(lastWeekOrder1.getTime() + 27 * 60 * 1000),
    deliveredAt: new Date(lastWeekOrder1.getTime() + 47 * 60 * 1000)
  });
  console.log('  ✓ Created delivered order (5 days ago)');

  // Order from 4 days ago - delivered
  if (veggiBurger && sweetPotatoFries) {
    const lastWeekOrder2 = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    await createOrder({
      customerId: customer1!.id,
      items: [
        { dishId: veggiBurger, dishName: 'Veggie Burger', dishPrice: 10.00, quantity: 1 },
        { dishId: sweetPotatoFries, dishName: 'Sweet Potato Fries', dishPrice: 4.50, quantity: 1 },
        { dishId: shake!, dishName: 'Vanilla Shake', dishPrice: 5.00, quantity: 1 }
      ],
      status: 'delivered',
      createdAt: lastWeekOrder2,
      acceptedAt: new Date(lastWeekOrder2.getTime() + 3 * 60 * 1000),
      preparingStartedAt: new Date(lastWeekOrder2.getTime() + 5 * 60 * 1000),
      readyAt: new Date(lastWeekOrder2.getTime() + 28 * 60 * 1000),
      deliveringStartedAt: new Date(lastWeekOrder2.getTime() + 30 * 60 * 1000),
      deliveredAt: new Date(lastWeekOrder2.getTime() + 50 * 60 * 1000)
    });
    console.log('  ✓ Created delivered order (4 days ago)');
  }

  // Order from 6 days ago - delivered
  if (baconBurger) {
    const lastWeekOrder3 = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    await createOrder({
      customerId: customer2!.id,
      items: [
        { dishId: baconBurger, dishName: 'Bacon Burger', dishPrice: 11.00, quantity: 3 },
        { dishId: fries, dishName: 'French Fries', dishPrice: 4.00, quantity: 3 }
      ],
      status: 'delivered',
      createdAt: lastWeekOrder3,
      acceptedAt: new Date(lastWeekOrder3.getTime() + 2 * 60 * 1000),
      preparingStartedAt: new Date(lastWeekOrder3.getTime() + 4 * 60 * 1000),
      readyAt: new Date(lastWeekOrder3.getTime() + 30 * 60 * 1000),
      deliveringStartedAt: new Date(lastWeekOrder3.getTime() + 32 * 60 * 1000),
      deliveredAt: new Date(lastWeekOrder3.getTime() + 55 * 60 * 1000)
    });
    console.log('  ✓ Created delivered order (6 days ago)');
  }

  // ==========================================
  // ORDERS FROM 1-2 DAYS AGO (for current week analytics)
  // ==========================================
  console.log('Creating orders from 1-2 days ago for analytics...');

  // Order from yesterday (1 day ago) - delivered
  const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  await createOrder({
    customerId: customer1!.id,
    items: [
      { dishId: cheeseburger, dishName: 'Classic Cheeseburger', dishPrice: 9.50, quantity: 1 },
      { dishId: fries, dishName: 'French Fries', dishPrice: 4.00, quantity: 1 },
      { dishId: shake!, dishName: 'Vanilla Shake', dishPrice: 5.00, quantity: 1 }
    ],
    status: 'delivered',
    createdAt: yesterday,
    acceptedAt: new Date(yesterday.getTime() + 3 * 60 * 1000),
    preparingStartedAt: new Date(yesterday.getTime() + 6 * 60 * 1000),
    readyAt: new Date(yesterday.getTime() + 26 * 60 * 1000),
    deliveringStartedAt: new Date(yesterday.getTime() + 28 * 60 * 1000),
    deliveredAt: new Date(yesterday.getTime() + 48 * 60 * 1000)
  });
  console.log('  ✓ Created delivered order (1 day ago - yesterday)');

  // Order from 2 days ago - delivered
  if (baconBurger) {
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    await createOrder({
      customerId: customer2!.id,
      items: [
        { dishId: baconBurger, dishName: 'Bacon Burger', dishPrice: 11.00, quantity: 2 },
        { dishId: fries, dishName: 'French Fries', dishPrice: 4.00, quantity: 2 }
      ],
      status: 'delivered',
      createdAt: twoDaysAgo,
      acceptedAt: new Date(twoDaysAgo.getTime() + 2 * 60 * 1000),
      preparingStartedAt: new Date(twoDaysAgo.getTime() + 5 * 60 * 1000),
      readyAt: new Date(twoDaysAgo.getTime() + 30 * 60 * 1000),
      deliveringStartedAt: new Date(twoDaysAgo.getTime() + 32 * 60 * 1000),
      deliveredAt: new Date(twoDaysAgo.getTime() + 52 * 60 * 1000)
    });
    console.log('  ✓ Created delivered order (2 days ago)');
  }

  // Another order from yesterday afternoon - delivered
  if (veggiBurger) {
    const yesterdayAfternoon = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000); // Yesterday + 6 hours
    await createOrder({
      customerId: customer1!.id,
      items: [
        { dishId: veggiBurger, dishName: 'Veggie Burger', dishPrice: 10.00, quantity: 2 },
        { dishId: sweetPotatoFries!, dishName: 'Sweet Potato Fries', dishPrice: 4.50, quantity: 2 }
      ],
      status: 'delivered',
      createdAt: yesterdayAfternoon,
      acceptedAt: new Date(yesterdayAfternoon.getTime() + 4 * 60 * 1000),
      preparingStartedAt: new Date(yesterdayAfternoon.getTime() + 7 * 60 * 1000),
      readyAt: new Date(yesterdayAfternoon.getTime() + 32 * 60 * 1000),
      deliveringStartedAt: new Date(yesterdayAfternoon.getTime() + 34 * 60 * 1000),
      deliveredAt: new Date(yesterdayAfternoon.getTime() + 54 * 60 * 1000)
    });
    console.log('  ✓ Created delivered order (yesterday afternoon)');
  }
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
    await createSampleOrders(db);

    printSummary();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
