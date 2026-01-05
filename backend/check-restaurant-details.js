const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

const restaurantId = '8adde063-7e9f-4073-aec5-73e863c19f03';

console.log('Checking restaurant details...\n');

db.all('SELECT * FROM restaurant_categories WHERE restaurant_id = ?', [restaurantId], (err, rows) => {
  console.log('Categories:', err ? err.message : rows);
  
  db.all('SELECT * FROM opening_hours WHERE restaurant_id = ?', [restaurantId], (err2, rows2) => {
    console.log('Opening Hours:', err2 ? err2.message : rows2);
    
    db.close();
  });
});
