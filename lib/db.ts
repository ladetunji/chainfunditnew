import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// You should set DATABASE_URL in your .env file
const sql = neon(process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@placeholder:5432/placeholder');

export const db = drizzle(sql, { schema });

// Export all tables for use in other files
export * from './schema'; 