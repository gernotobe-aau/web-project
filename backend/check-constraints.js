const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('='.repeat(70));
console.log('TESTING DATABASE CONSTRAINTS');
console.log('='.repeat(70));

// Test 1: Negative prices should fail
console.log('\n1. Testing CHECK constraint: negative final_price should fail');
db.run(`INSERT INTO orders (id, customer_id, restaurant_id, subtotal, final_price, delivery_street, delivery_postal_code, delivery_city) 
        VALUES ('test-1', 1, 1, -10, -10, 'Test St', '1234', 'TestCity')`, 
    (err) => {
        if (err) {
            console.log('  ✓ PASS: Negative price rejected:', err.message);
        } else {
            console.log('  ✗ FAIL: Negative price was accepted');
        }
        
        // Test 2: Invalid order status should fail
        console.log('\n2. Testing CHECK constraint: invalid order_status should fail');
        db.run(`INSERT INTO orders (id, customer_id, restaurant_id, subtotal, final_price, order_status, delivery_street, delivery_postal_code, delivery_city) 
                VALUES ('test-2', 1, 1, 10, 10, 'invalid_status', 'Test St', '1234', 'TestCity')`, 
            (err) => {
                if (err) {
                    console.log('  ✓ PASS: Invalid status rejected:', err.message);
                } else {
                    console.log('  ✗ FAIL: Invalid status was accepted');
                }
                
                // Test 3: Rating outside 1-5 range should fail
                console.log('\n3. Testing CHECK constraint: rating outside 1-5 should fail');
                db.run(`INSERT INTO restaurant_reviews (restaurant_id, customer_id, rating) 
                        VALUES (1, 1, 6)`, 
                    (err) => {
                        if (err) {
                            console.log('  ✓ PASS: Invalid rating rejected:', err.message);
                        } else {
                            console.log('  ✗ FAIL: Invalid rating was accepted');
                        }
                        
                        // Test 4: Zero quantity should fail
                        console.log('\n4. Testing CHECK constraint: zero quantity should fail');
                        db.run(`INSERT INTO order_items (order_id, dish_name, dish_price, quantity, subtotal) 
                                VALUES ('test-order', 'Test Dish', 10, 0, 0)`, 
                            (err) => {
                                if (err) {
                                    console.log('  ✓ PASS: Zero quantity rejected:', err.message);
                                } else {
                                    console.log('  ✗ FAIL: Zero quantity was accepted');
                                }
                                
                                // Test 5: Invalid discount type should fail
                                console.log('\n5. Testing CHECK constraint: invalid discount_type should fail');
                                db.run(`INSERT INTO vouchers (code, discount_type, discount_value, valid_from, valid_until) 
                                        VALUES ('TEST123', 'invalid_type', 10, '2025-01-01', '2026-01-01')`, 
                                    (err) => {
                                        if (err) {
                                            console.log('  ✓ PASS: Invalid discount_type rejected:', err.message);
                                        } else {
                                            console.log('  ✗ FAIL: Invalid discount_type was accepted');
                                        }
                                        
                                        // Test 6: Check indexes exist
                                        console.log('\n6. Testing indexes exist');
                                        db.all(`SELECT name FROM sqlite_master WHERE type='index' AND (
                                                name LIKE 'idx_orders%' OR 
                                                name LIKE 'idx_order_items%' OR 
                                                name LIKE 'idx_vouchers%' OR 
                                                name LIKE 'idx_restaurant_reviews%' OR 
                                                name LIKE 'idx_dish_reviews%' OR
                                                name LIKE 'idx_order_status%'
                                            ) ORDER BY name;`, 
                                            (err, rows) => {
                                                if (err) {
                                                    console.error('  ✗ Error:', err);
                                                } else {
                                                    console.log('  Found', rows.length, 'indexes:');
                                                    rows.forEach(r => console.log('    ✓', r.name));
                                                }
                                                
                                                // Test 7: Check triggers exist
                                                console.log('\n7. Testing triggers exist');
                                                db.all(`SELECT name FROM sqlite_master WHERE type='trigger' AND (
                                                        name LIKE 'update%timestamp%'
                                                    ) ORDER BY name;`, 
                                                    (err, rows) => {
                                                        if (err) {
                                                            console.error('  ✗ Error:', err);
                                                        } else {
                                                            console.log('  Found', rows.length, 'triggers:');
                                                            rows.forEach(r => console.log('    ✓', r.name));
                                                        }
                                                        
                                                        console.log('\n' + '='.repeat(70));
                                                        console.log('ALL TESTS COMPLETED');
                                                        console.log('='.repeat(70) + '\n');
                                                        
                                                        db.close();
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    }
);
