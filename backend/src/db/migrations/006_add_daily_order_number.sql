-- Migration: Add daily order number to orders table
-- This provides a human-readable order number that resets daily per restaurant

-- Add the daily_order_number column
ALTER TABLE orders ADD COLUMN daily_order_number INTEGER;

-- Add the order_date column for easy daily grouping
ALTER TABLE orders ADD COLUMN order_date TEXT;

-- Update existing orders with their order_date (extracted from created_at)
UPDATE orders SET order_date = DATE(created_at);

-- Update existing orders with sequential daily numbers per restaurant
WITH numbered_orders AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY restaurant_id, DATE(created_at) ORDER BY created_at) as daily_num
  FROM orders
)
UPDATE orders 
SET daily_order_number = (
  SELECT daily_num FROM numbered_orders WHERE numbered_orders.id = orders.id
);
