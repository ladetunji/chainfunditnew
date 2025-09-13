import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// This script will run migrations to set up the database schema
async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  try {
    await migrate(db, { migrationsFolder: './lib/migrations' });
  } catch (error) {
    process.exit(1);
  }
}

main(); 