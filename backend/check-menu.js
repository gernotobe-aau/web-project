const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('=== CATEGORIES ===');
const categories = db.prepare('SELECT * FROM categories').all();
console.log(`Total categories: ${categories.length}`);
categories.forEach(cat => {
  console.log(`  ID: ${cat.id}, Restaurant: ${cat.restaurant_id}, Name: ${cat.name}`);
});

console.log('\n=== DISHES ===');
const dishes = db.prepare('SELECT * FROM dishes').all();
console.log(`Total dishes: ${dishes.length}`);
dishes.forEach(dish => {
  console.log(`  ID: ${dish.id}, Restaurant: ${dish.restaurant_id}, Category: ${dish.category_id}, Name: ${dish.name}, Price: ${dish.price}`);
});

db.close();
