-- Migration 005: Orders and Reviews System
-- This migration extends the database with tables for:
-- - Orders and Order Items
-- - Order Status History
-- - Vouchers/Promotion Codes
-- - Restaurant and Dish Reviews
-- - Cooking time for dishes (for delivery time calculation)

-- ============================================================================
-- EXTEND DISHES TABLE WITH COOKING TIME
-- ============================================================================

-- Add cooking_time_minutes to dishes table for delivery time calculation
ALTER TABLE dishes ADD COLUMN cooking_time_minutes INTEGER DEFAULT 15 NOT NULL CHECK(cooking_time_minutes > 0);

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,  -- UUID as TEXT
    customer_id INTEGER NOT NULL,
    restaurant_id INTEGER NOT NULL,
    
    -- Order status
    order_status TEXT NOT NULL DEFAULT 'pending' CHECK(order_status IN ('pending', 'accepted', 'rejected', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled')),
    
    -- Pricing
    subtotal REAL NOT NULL CHECK(subtotal >= 0),
    discount_amount REAL NOT NULL DEFAULT 0 CHECK(discount_amount >= 0),
    final_price REAL NOT NULL CHECK(final_price >= 0),
    
    -- Voucher info (optional)
    voucher_id INTEGER,
    voucher_code TEXT,
    
    -- Delivery address (copied from customer at order time)
    delivery_street TEXT NOT NULL,
    delivery_postal_code TEXT NOT NULL,
    delivery_city TEXT NOT NULL,
    
    -- Estimated delivery time in minutes
    estimated_delivery_minutes INTEGER,
    
    -- Order notes (optional)
    customer_notes TEXT,
    restaurant_notes TEXT,
    
    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME,
    rejected_at DATETIME,
    preparing_started_at DATETIME,
    ready_at DATETIME,
    delivering_started_at DATETIME,
    delivered_at DATETIME,
    
    -- Foreign Keys
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL
);

-- Indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created ON orders(restaurant_id, created_at);

-- ============================================================================
-- ORDER ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    dish_id INTEGER,  -- Nullable in case dish gets deleted
    
    -- Dish information at time of order (snapshot)
    dish_name TEXT NOT NULL,
    dish_price REAL NOT NULL CHECK(dish_price >= 0),
    
    -- Quantity and subtotal
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    subtotal REAL NOT NULL CHECK(subtotal >= 0),
    
    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE SET NULL
);

-- Indexes for order_items table
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_dish ON order_items(dish_id);

-- ============================================================================
-- ORDER STATUS HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled')),
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    
    -- Foreign Key
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Index for order status history
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_time ON order_status_history(order_id, changed_at);

-- ============================================================================
-- VOUCHERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS vouchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE COLLATE NOCASE,
    
    -- Discount type and value
    discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed_amount')),
    discount_value REAL NOT NULL CHECK(discount_value > 0),
    
    -- Validity
    is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
    valid_from DATETIME NOT NULL,
    valid_until DATETIME NOT NULL CHECK(valid_until > valid_from),
    
    -- Usage limits
    usage_limit INTEGER,  -- NULL = unlimited
    usage_count INTEGER NOT NULL DEFAULT 0 CHECK(usage_count >= 0),
    
    -- Restaurant-specific (NULL = global voucher)
    restaurant_id INTEGER,
    
    -- Description
    description TEXT,
    
    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Indexes for vouchers table
CREATE UNIQUE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code COLLATE NOCASE);

-- Additional constraint for percentage vouchers
-- Note: SQLite doesn't support conditional CHECK constraints across columns directly,
-- so this needs to be validated in the business logic layer

-- ============================================================================
-- RESTAURANT REVIEWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS restaurant_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    order_id INTEGER,  -- Optional: link to order
    
    -- Rating and comment
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    
    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    
    -- Unique constraint: one review per customer per order per restaurant
    UNIQUE(restaurant_id, customer_id, order_id)
);

-- Indexes for restaurant_reviews table
CREATE INDEX IF NOT EXISTS idx_restaurant_reviews_restaurant ON restaurant_reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_reviews_customer ON restaurant_reviews(customer_id);

-- ============================================================================
-- DISH REVIEWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS dish_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dish_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    order_id INTEGER,  -- Optional: link to order
    
    -- Rating and comment
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    
    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    
    -- Unique constraint: one review per customer per order per dish
    UNIQUE(dish_id, customer_id, order_id)
);

-- Indexes for dish_reviews table
CREATE INDEX IF NOT EXISTS idx_dish_reviews_dish ON dish_reviews(dish_id);
CREATE INDEX IF NOT EXISTS idx_dish_reviews_customer ON dish_reviews(customer_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Orders updated_at trigger
CREATE TRIGGER IF NOT EXISTS update_orders_timestamp 
AFTER UPDATE ON orders 
FOR EACH ROW 
BEGIN
    UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Vouchers updated_at trigger
CREATE TRIGGER IF NOT EXISTS update_vouchers_timestamp 
AFTER UPDATE ON vouchers 
FOR EACH ROW 
BEGIN
    UPDATE vouchers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Restaurant reviews updated_at trigger
CREATE TRIGGER IF NOT EXISTS update_restaurant_reviews_timestamp 
AFTER UPDATE ON restaurant_reviews 
FOR EACH ROW 
BEGIN
    UPDATE restaurant_reviews SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Dish reviews updated_at trigger
CREATE TRIGGER IF NOT EXISTS update_dish_reviews_timestamp 
AFTER UPDATE ON dish_reviews 
FOR EACH ROW 
BEGIN
    UPDATE dish_reviews SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- SAMPLE DATA FOR DEVELOPMENT (Optional - Comment out for production)
-- ============================================================================

-- Sample vouchers
INSERT OR IGNORE INTO vouchers (code, discount_type, discount_value, valid_from, valid_until, description) 
VALUES 
    ('WELCOME10', 'percentage', 10, '2025-01-01 00:00:00', '2026-12-31 23:59:59', 'Welcome voucher: 10% off'),
    ('SAVE5', 'fixed_amount', 5, '2025-01-01 00:00:00', '2026-12-31 23:59:59', 'Save 5€ on your order');
