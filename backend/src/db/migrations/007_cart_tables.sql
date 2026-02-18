-- Migration 005: Orders and Reviews System

DROP TABLE IF EXISTS carts;
CREATE TABLE IF NOT EXISTS carts (
    customer_id TEXT PRIMARY KEY,
    
    -- Voucher info (optional)
    voucher_id INTEGER,
    voucher_code TEXT,
    
    -- Order notes (optional)
    customer_notes TEXT,
    
    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL
);


DROP TABLE IF EXISTS cart_items;
CREATE TABLE IF NOT EXISTS cart_items (
    customer_id TEXT NOT NULL,
    restaurant_id TEXT NOT NULL,
    dish_id INTEGER,  -- Nullable in case dish gets deleted
    
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    note TEXT,
    
    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (customer_id, restaurant_id, dish_id)
    -- Foreign Keys
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE
);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- carts updated_at trigger
CREATE TRIGGER IF NOT EXISTS update_carts_timestamp 
AFTER UPDATE ON carts 
FOR EACH ROW 
BEGIN
    UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE customer_id = NEW.customer_id;
END;
