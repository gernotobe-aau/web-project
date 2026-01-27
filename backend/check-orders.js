const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('\n=== SAMPLE ORDERS ===\n');

db.all(`
  SELECT 
    o.id,
    o.order_status,
    o.final_price,
    o.created_at,
    o.delivered_at,
    c.first_name || ' ' || c.last_name as customer_name,
    r.name as restaurant_name
  FROM orders o
  JOIN customers c ON o.customer_id = c.id
  JOIN restaurants r ON o.restaurant_id = r.id
  ORDER BY o.created_at
`, (err, orders) => {
  if (err) {
    console.error(err);
    db.close();
    return;
  }

  orders.forEach((order, idx) => {
    const createdTime = new Date(order.created_at).toLocaleString('de-DE');
    const deliveredTime = order.delivered_at ? new Date(order.delivered_at).toLocaleString('de-DE') : '-';
    
    console.log(`Order ${idx + 1}:`);
    console.log(`  Status: ${order.order_status}`);
    console.log(`  Customer: ${order.customer_name}`);
    console.log(`  Restaurant: ${order.restaurant_name}`);
    console.log(`  Price: €${order.final_price}`);
    console.log(`  Created: ${createdTime}`);
    console.log(`  Delivered: ${deliveredTime}`);
    console.log('');
  });

  console.log(`Total orders: ${orders.length}\n`);

  db.close();
});
