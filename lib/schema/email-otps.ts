import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const emailOtps = pgTable('email_otps', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  otp: varchar('otp', { length: 10 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}); 