const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('='.repeat(70));
console.log('DATABASE TABLES');
console.log('='.repeat(70));

db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;", (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        rows.forEach(r => console.log('  ✓', r.name));
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('ORDERS TABLE STRUCTURE');
    console.log('='.repeat(70));
    
    db.all("PRAGMA table_info(orders);", (err, cols) => {
        if (err) {
            console.error('Error:', err);
        } else {
            cols.forEach(c => console.log(`  ${c.name} (${c.type}) ${c.notnull ? 'NOT NULL' : ''} ${c.dflt_value ? 'DEFAULT ' + c.dflt_value : ''}`));
        }
        
        console.log('\n' + '='.repeat(70));
        console.log('ORDER_ITEMS TABLE STRUCTURE');
        console.log('='.repeat(70));
        
        db.all("PRAGMA table_info(order_items);", (err, cols) => {
            if (err) {
                console.error('Error:', err);
            } else {
                cols.forEach(c => console.log(`  ${c.name} (${c.type}) ${c.notnull ? 'NOT NULL' : ''}`));
            }
            
            console.log('\n' + '='.repeat(70));
            console.log('VOUCHERS TABLE STRUCTURE');
            console.log('='.repeat(70));
            
            db.all("PRAGMA table_info(vouchers);", (err, cols) => {
                if (err) {
                    console.error('Error:', err);
                } else {
                    cols.forEach(c => console.log(`  ${c.name} (${c.type}) ${c.notnull ? 'NOT NULL' : ''}`));
                }
                
                console.log('\n' + '='.repeat(70));
                console.log('RESTAURANT_REVIEWS TABLE STRUCTURE');
                console.log('='.repeat(70));
                
                db.all("PRAGMA table_info(restaurant_reviews);", (err, cols) => {
                    if (err) {
                        console.error('Error:', err);
                    } else {
                        cols.forEach(c => console.log(`  ${c.name} (${c.type}) ${c.notnull ? 'NOT NULL' : ''}`));
                    }
                    
                    console.log('\n' + '='.repeat(70));
                    console.log('DISH_REVIEWS TABLE STRUCTURE');
                    console.log('='.repeat(70));
                    
                    db.all("PRAGMA table_info(dish_reviews);", (err, cols) => {
                        if (err) {
                            console.error('Error:', err);
                        } else {
                            cols.forEach(c => console.log(`  ${c.name} (${c.type}) ${c.notnull ? 'NOT NULL' : ''}`));
                        }
                        
                        console.log('\n' + '='.repeat(70));
                        console.log('DISHES TABLE - COOKING_TIME_MINUTES FIELD');
                        console.log('='.repeat(70));
                        
                        db.all("PRAGMA table_info(dishes);", (err, cols) => {
                            if (err) {
                                console.error('Error:', err);
                            } else {
                                const cookingTimeField = cols.find(c => c.name === 'cooking_time_minutes');
                                if (cookingTimeField) {
                                    console.log('  ✓ cooking_time_minutes field exists:', cookingTimeField);
                                } else {
                                    console.log('  ✗ cooking_time_minutes field NOT found');
                                }
                            }
                            
                            console.log('\n' + '='.repeat(70));
                            console.log('SAMPLE VOUCHERS');
                            console.log('='.repeat(70));
                            
                            db.all("SELECT * FROM vouchers;", (err, vouchers) => {
                                if (err) {
                                    console.error('Error:', err);
                                } else {
                                    vouchers.forEach(v => console.log(`  ✓ ${v.code}: ${v.discount_type} ${v.discount_value}${v.discount_type === 'percentage' ? '%' : '€'}`));
                                }
                                
                                db.close();
                            });
                        });
                    });
                });
            });
        });
    });
});
