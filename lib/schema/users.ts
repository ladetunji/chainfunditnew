import { pgTable, uuid, varchar, timestamp, text, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  countryCode: varchar('country_code', { length: 5 }),
  avatar: text('avatar'),
  isVerified: boolean('is_verified').default(false),
  hasCompletedProfile: boolean('has_completed_profile').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations will be defined later to avoid circular dependencies

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert; 