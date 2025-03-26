import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';

// Create and export the database connection
export const db = drizzle(sql);

// Initialize database with the required tables
export async function initializeDb() {
  try {
    // Check if selections table exists
    const checkTableResult = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'selections'
      );
    `;
    
    const tableExists = checkTableResult.rows[0].exists;
    
    if (!tableExists) {
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
          selected_options JSONB NOT NULL,
          note TEXT
        )
      `;
    } else {
      // Check if the note column exists
      const checkColumnResult = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'selections' AND column_name = 'note'
        );
      `;
      
      const columnExists = checkColumnResult.rows[0].exists;
      
      // Add the note column if it doesn't exist
      if (!columnExists) {
        await sql`ALTER TABLE selections ADD COLUMN note TEXT`;
      }
    }
    
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}
