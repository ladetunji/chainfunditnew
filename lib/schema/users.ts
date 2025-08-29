import { pgTable, uuid, varchar, timestamp, text, boolean, index } from 'drizzle-orm/pg-core';
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
  hasSeenWelcomeModal: boolean('has_seen_welcome_modal').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  instagram: varchar('instagram', { length: 255 }),
  facebook: varchar('facebook', { length: 255 }),
  linkedin: varchar('linkedin', { length: 255 }),
  twitter: varchar('twitter', { length: 255 }),
  tiktok: varchar('tiktok', { length: 255 }),
  youtube: varchar('youtube', { length: 255 }),
  bio: text('bio'),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  phoneIdx: index('users_phone_idx').on(table.phone),
  verifiedIdx: index('users_verified_idx').on(table.isVerified),
}));

// Relations will be defined later to avoid circular dependencies

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;