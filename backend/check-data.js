const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('Checking database...\n');

db.all('SELECT COUNT(*) as count FROM restaurants', [], (err, rows) => {
  if (err) {
    console.error('Error querying restaurants:', err.message);
  } else {
    console.log('Restaurants in DB:', rows[0].count);
  }
  
  db.all('SELECT COUNT(*) as count FROM restaurant_owners', [], (err2, rows2) => {
    if (err2) {
      console.error('Error querying owners:', err2.message);
    } else {
      console.log('Restaurant Owners in DB:', rows2[0].count);
    }
    
    db.all('SELECT * FROM restaurants LIMIT 5', [], (err3, rows3) => {
      if (err3) {
        console.error('Error querying restaurants details:', err3.message);
      } else {
        console.log('\nRestaurants:');
        console.log(rows3);
      }
      
      db.close();
    });
  });
});
