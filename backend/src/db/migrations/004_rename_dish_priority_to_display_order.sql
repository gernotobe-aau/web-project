-- Migration 004: Rename dish priority to display_order
-- Renames the priority column in dishes table to display_order for consistency

-- SQLite doesn't support RENAME COLUMN directly in older versions,
-- so we need to recreate the table

-- Create new dishes table with display_order
CREATE TABLE IF NOT EXISTS dishes_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id TEXT NOT NULL,
    category_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    photo_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Copy data from old table to new table
INSERT INTO dishes_new (id, restaurant_id, category_id, name, description, price, display_order, photo_url, created_at, updated_at)
SELECT id, restaurant_id, category_id, name, description, price, priority, photo_url, created_at, updated_at
FROM dishes;

-- Drop old table
DROP TABLE dishes;

-- Rename new table to dishes
ALTER TABLE dishes_new RENAME TO dishes;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_dishes_category_order ON dishes(category_id, display_order, name);
CREATE INDEX IF NOT EXISTS idx_dishes_restaurant ON dishes(restaurant_id);
