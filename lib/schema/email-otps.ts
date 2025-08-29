import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';

export const emailOtps = pgTable('email_otps', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  otp: varchar('otp', { length: 10 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('email_otps_email_idx').on(table.email),
  expiresIdx: index('email_otps_expires_idx').on(table.expiresAt),
  emailOtpIdx: index('email_otps_email_otp_idx').on(table.email, table.otp),
})); 