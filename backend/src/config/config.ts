import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  port: number;
  jwtSecret: string;
  jwtExpiration: string | number;
  corsOrigin: string;
  dbPath: string;
  minAgeCustomer: number;
  minAgeRestaurantOwner: number;
  cuisineCategories: string[];
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiration: process.env.JWT_EXPIRATION || '1h',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  dbPath: process.env.DB_PATH || './database.sqlite',
  minAgeCustomer: parseInt(process.env.MIN_AGE_CUSTOMER || '16', 10),
  minAgeRestaurantOwner: parseInt(process.env.MIN_AGE_RESTAURANT_OWNER || '18', 10),
  cuisineCategories: process.env.CUISINE_CATEGORIES 
    ? process.env.CUISINE_CATEGORIES.split(',').map(c => c.trim())
    : ['Italienisch', 'Asiatisch', 'Deutsch', 'Türkisch', 'Pizza', 'Burger', 'Vegetarisch', 'Vegan']
};

// Validate required configuration
if (!config.jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required');
}

export default config;
