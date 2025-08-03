import { sql } from 'drizzle-orm';

export async function up(db) {
  await db.execute(sql`ALTER TABLE users ADD COLUMN has_seen_welcome_modal BOOLEAN DEFAULT FALSE`);
}

export async function down(db) {
  await db.execute(sql`ALTER TABLE users DROP COLUMN has_seen_welcome_modal`);
}