-- Migration 002: Authentication Tables
-- Creates tables for customers, restaurant_owners, and restaurants

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY, -- UUID
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date TEXT NOT NULL, -- ISO 8601 date format (YYYY-MM-DD)
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  
  -- Delivery address fields
  delivery_street TEXT NOT NULL,
  delivery_house_number TEXT NOT NULL,
  delivery_staircase TEXT,
  delivery_door TEXT,
  delivery_postal_code TEXT NOT NULL,
  delivery_city TEXT NOT NULL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for email lookups (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email COLLATE NOCASE);

-- Restaurant owners table
CREATE TABLE IF NOT EXISTS restaurant_owners (
  id TEXT PRIMARY KEY, -- UUID
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date TEXT NOT NULL, -- ISO 8601 date format (YYYY-MM-DD)
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for email lookups (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_restaurant_owners_email ON restaurant_owners(email COLLATE NOCASE);

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id TEXT PRIMARY KEY, -- UUID
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  
  -- Restaurant address fields
  street TEXT NOT NULL,
  house_number TEXT NOT NULL,
  staircase TEXT,
  door TEXT,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  
  -- Contact information
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (owner_id) REFERENCES restaurant_owners(id) ON DELETE CASCADE
);

-- Unique constraint: restaurant name must be unique within the same city
CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_name_city ON restaurants(name COLLATE NOCASE, city COLLATE NOCASE);

-- Restaurant categories/cuisine types (many-to-many relationship)
CREATE TABLE IF NOT EXISTS restaurant_categories (
  restaurant_id TEXT NOT NULL,
  category TEXT NOT NULL,
  
  PRIMARY KEY (restaurant_id, category),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Restaurant opening hours
CREATE TABLE IF NOT EXISTS opening_hours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  open_time TEXT, -- Format: HH:MM (24h)
  close_time TEXT, -- Format: HH:MM (24h)
  is_closed BOOLEAN NOT NULL DEFAULT 0,
  
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Index for efficient opening hours lookups
CREATE INDEX IF NOT EXISTS idx_opening_hours_restaurant ON opening_hours(restaurant_id);
