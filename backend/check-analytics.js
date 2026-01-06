const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const db = new sqlite3.Database('./database.sqlite');

console.log('='.repeat(70));
console.log('TESTING ANALYTICS QUERIES');
console.log('='.repeat(70));

// Get first customer and restaurant
db.get('SELECT id FROM customers LIMIT 1', (err, customer) => {
    if (err || !customer) {
        console.log('No customers found, skipping tests');
        db.close();
        return;
    }
    
    db.get('SELECT id FROM restaurants LIMIT 1', (err, restaurant) => {
        if (err || !restaurant) {
            console.log('No restaurants found, skipping tests');
            db.close();
            return;
        }
        
        db.get('SELECT id FROM dishes WHERE restaurant_id = ? LIMIT 1', [restaurant.id], (err, dish) => {
            if (err || !dish) {
                console.log('No dishes found, skipping tests');
                db.close();
                return;
            }
            
            console.log(`\nUsing customer ID: ${customer.id}, restaurant ID: ${restaurant.id}, dish ID: ${dish.id}`);
            
            // Create a test order
            const orderId = uuidv4();
            const insertOrder = `
                INSERT INTO orders (
                    id, customer_id, restaurant_id, order_status, 
                    subtotal, discount_amount, final_price,
                    delivery_street, delivery_postal_code, delivery_city,
                    estimated_delivery_minutes
                ) VALUES (?, ?, ?, 'delivered', 25.50, 2.50, 23.00, 'Test Street 1', '9020', 'Klagenfurt', 35)
            `;
            
            db.run(insertOrder, [orderId, customer.id, restaurant.id], (err) => {
                if (err) {
                    console.error('Error creating test order:', err);
                    db.close();
                    return;
                }
                
                console.log('✓ Test order created:', orderId);
                
                // Add order items
                const insertItem = `
                    INSERT INTO order_items (order_id, dish_id, dish_name, dish_price, quantity, subtotal)
                    VALUES (?, ?, 'Test Dish', 10.50, 2, 21.00)
                `;
                
                db.run(insertItem, [orderId, dish.id], (err) => {
                    if (err) {
                        console.error('Error creating order item:', err);
                    } else {
                        console.log('✓ Order item created');
                    }
                    
                    // Add order status history
                    const statuses = ['pending', 'accepted', 'preparing', 'ready', 'delivering', 'delivered'];
                    let statusIndex = 0;
                    
                    const insertStatus = () => {
                        if (statusIndex >= statuses.length) {
                            runAnalyticsQueries();
                            return;
                        }
                        
                        db.run(
                            'INSERT INTO order_status_history (order_id, status) VALUES (?, ?)',
                            [orderId, statuses[statusIndex]],
                            (err) => {
                                if (err) {
                                    console.error('Error inserting status:', err);
                                } else {
                                    console.log(`✓ Status history: ${statuses[statusIndex]}`);
                                }
                                statusIndex++;
                                insertStatus();
                            }
                        );
                    };
                    
                    insertStatus();
                });
            });
            
            function runAnalyticsQueries() {
                console.log('\n' + '='.repeat(70));
                console.log('ANALYTICS QUERY TESTS');
                console.log('='.repeat(70));
                
                // Query 1: Orders per day
                console.log('\n1. Orders per day for restaurant:');
                db.all(`
                    SELECT DATE(created_at) as order_date, COUNT(*) as order_count
                    FROM orders
                    WHERE restaurant_id = ?
                    GROUP BY order_date
                    ORDER BY order_date DESC
                    LIMIT 5
                `, [restaurant.id], (err, rows) => {
                    if (err) {
                        console.error('  Error:', err);
                    } else {
                        rows.forEach(r => console.log(`  ${r.order_date}: ${r.order_count} order(s)`));
                    }
                    
                    // Query 2: Most ordered dishes
                    console.log('\n2. Most ordered dishes:');
                    db.all(`
                        SELECT d.name, SUM(oi.quantity) as total_ordered
                        FROM order_items oi
                        JOIN orders o ON oi.order_id = o.id
                        LEFT JOIN dishes d ON oi.dish_id = d.id
                        WHERE o.restaurant_id = ?
                        GROUP BY oi.dish_id, d.name
                        ORDER BY total_ordered DESC
                        LIMIT 5
                    `, [restaurant.id], (err, rows) => {
                        if (err) {
                            console.error('  Error:', err);
                        } else {
                            rows.forEach(r => console.log(`  ${r.name || 'Deleted Dish'}: ${r.total_ordered} ordered`));
                        }
                        
                        // Query 3: Average restaurant rating
                        console.log('\n3. Average restaurant rating:');
                        db.get(`
                            SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
                            FROM restaurant_reviews
                            WHERE restaurant_id = ?
                        `, [restaurant.id], (err, row) => {
                            if (err) {
                                console.error('  Error:', err);
                            } else {
                                if (row.review_count > 0) {
                                    console.log(`  ${row.avg_rating.toFixed(2)} stars (${row.review_count} reviews)`);
                                } else {
                                    console.log('  No reviews yet');
                                }
                            }
                            
                            // Query 4: Order status history
                            console.log('\n4. Order status history for test order:');
                            db.all(`
                                SELECT status, changed_at
                                FROM order_status_history
                                WHERE order_id = ?
                                ORDER BY changed_at ASC
                            `, [orderId], (err, rows) => {
                                if (err) {
                                    console.error('  Error:', err);
                                } else {
                                    rows.forEach((r, i) => console.log(`  ${i+1}. ${r.status} at ${r.changed_at}`));
                                }
                                
                                // Query 5: Validate voucher
                                console.log('\n5. Validate voucher WELCOME10:');
                                db.get(`
                                    SELECT * FROM vouchers
                                    WHERE code = ? COLLATE NOCASE
                                      AND is_active = 1
                                      AND datetime('now') BETWEEN valid_from AND valid_until
                                      AND (usage_limit IS NULL OR usage_count < usage_limit)
                                `, ['WELCOME10'], (err, voucher) => {
                                    if (err) {
                                        console.error('  Error:', err);
                                    } else if (voucher) {
                                        console.log(`  ✓ Valid: ${voucher.discount_type} ${voucher.discount_value}${voucher.discount_type === 'percentage' ? '%' : '€'}`);
                                        console.log(`  Used: ${voucher.usage_count}${voucher.usage_limit ? '/' + voucher.usage_limit : ''}`);
                                    } else {
                                        console.log('  ✗ Voucher not valid or not found');
                                    }
                                    
                                    console.log('\n' + '='.repeat(70));
                                    console.log('ALL ANALYTICS TESTS COMPLETED');
                                    console.log('='.repeat(70) + '\n');
                                    
                                    db.close();
                                });
                            });
                        });
                    });
                });
            }
        });
    });
});
