import sqlite3 from 'sqlite3';
import config from '../config/config';
import { runMigrations } from './migration-runner';

let db: sqlite3.Database | null = null;

export async function initDatabase(): Promise<sqlite3.Database> {
  if (db) {
    return db;
  }

  console.log('Initializing database...');
  
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(config.dbPath, async (err) => {
      if (err) {
        reject(err);
        return;
      }

      // Aktiviere Foreign Keys
      db!.run('PRAGMA foreign_keys = ON', async (pragmaErr) => {
        if (pragmaErr) {
          reject(pragmaErr);
          return;
        }

        try {
          // Führe Migrationen aus
          await runMigrations();
          console.log('Database initialized successfully');
          resolve(db!);
        } catch (migrationErr) {
          reject(migrationErr);
        }
      });
    });
  });
}

export function getDatabase(): sqlite3.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// Alias for convenience
export const getDb = getDatabase;

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}
