import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';

// This script will run migrations to set up the database schema
async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log('Running migrations...');
  
  try {
    await migrate(db, { migrationsFolder: './lib/migrations' });
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main(); 