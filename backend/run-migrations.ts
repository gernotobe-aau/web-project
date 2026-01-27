import { initDatabase } from './src/db/init';

async function runMigrations() {
  console.log('Running database migrations...');
  try {
    await initDatabase();
    console.log('✓ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
