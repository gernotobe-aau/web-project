import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import config from '../config/config';

function runQuery(db: sqlite3.Database, sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function getAppliedMigrations(db: sqlite3.Database): Promise<string[]> {
  return new Promise((resolve, reject) => {
    db.all('SELECT filename FROM _migrations', [], (err, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows.map(r => r.filename));
    });
  });
}

function insertMigration(db: sqlite3.Database, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO _migrations (filename) VALUES (?)', [filename], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function runMigrations(): Promise<void> {
  const db = new sqlite3.Database(config.dbPath);
  
  console.log('Starting database migrations...');
  
  try {
    // Erstelle _migrations Tabelle falls nicht vorhanden
    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Lese alle Migration-Dateien
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    // Hole bereits angewendete Migrationen
    const appliedMigrations = await getAppliedMigrations(db);
    const appliedSet = new Set(appliedMigrations);

    // Führe ausstehende Migrationen aus
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`✓ Migration ${file} already applied`);
        continue;
      }

      console.log(`→ Applying migration ${file}...`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      // Führe Migration in einer Transaktion aus
      await runQuery(db, 'BEGIN TRANSACTION');
      try {
        await runQuery(db, sql);
        await insertMigration(db, file);
        await runQuery(db, 'COMMIT');
        console.log(`✓ Migration ${file} applied successfully`);
      } catch (error) {
        await runQuery(db, 'ROLLBACK');
        throw error;
      }
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Wenn direkt ausgeführt, starte Migrationen
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
