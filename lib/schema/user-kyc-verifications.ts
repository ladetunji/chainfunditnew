import { pgTable, uuid, varchar, timestamp, text, jsonb, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const userKycVerifications = pgTable('user_kyc_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).default('persona').notNull(),
  status: varchar('status', { length: 30 }).default('pending').notNull(), // pending, processing, in_review, approved, rejected, failed
  referenceId: varchar('reference_id', { length: 255 }),
  externalInquiryId: varchar('external_inquiry_id', { length: 255 }),
  sessionToken: varchar('session_token', { length: 255 }),
  riskScore: decimal('risk_score', { precision: 5, scale: 2 }),
  payload: jsonb('payload'),
  failureReason: text('failure_reason'),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userKycVerificationsRelations = relations(userKycVerifications, ({ one }) => ({
  user: one(users, {
    fields: [userKycVerifications.userId],
    references: [users.id],
  }),
}));

export type UserKycVerification = typeof userKycVerifications.$inferSelect;
export type NewUserKycVerification = typeof userKycVerifications.$inferInsert;

