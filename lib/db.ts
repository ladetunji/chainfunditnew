import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// You should set DATABASE_URL in your .env file
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}
const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });

// Export all tables for use in other files
export * from './schema'; 