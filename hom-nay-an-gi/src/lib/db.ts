import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';

// Create and export the database connection
export const db = drizzle(sql);

// Initialize database with the required tables
export async function initializeDb() {
  try {
    // Create selections table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS selections (
        id TEXT PRIMARY KEY,
        dish_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        photo_url TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        timestamp BIGINT NOT NULL, 
        client_name TEXT NOT NULL,
        selected_options JSONB NOT NULL
      )
    `;
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}
