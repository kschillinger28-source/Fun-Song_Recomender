import sqlite3 from 'sqlite3';

let db = null;

export async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database('./recommendations.db', (err) => {
      if (err) return reject(err);

      db.serialize(() => {
        db.run(`
          CREATE TABLE IF NOT EXISTS SeedSearches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS SavedPlaylist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id TEXT NOT NULL UNIQUE,
            track_name TEXT NOT NULL,
            artist TEXT NOT NULL,
            image_url TEXT,
            preview_url TEXT,
            genre TEXT,
            background TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) return reject(err);
          console.log('✅ Database initialized');
          resolve();
        });
      });
    });
  });
}

export function getDb() {
  return db;
}
