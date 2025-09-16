import { pgTable, uuid, varchar, timestamp, decimal, text, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const donations = pgTable('donations', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull(),
  donorId: uuid('donor_id').notNull(),
  chainerId: uuid('chainer_id'), // nullable - only if referred by chainer
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(), // USD, GBP, NGN
  paymentStatus: varchar('payment_status', { length: 20 }).default('pending').notNull(), // pending, completed, failed
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // stripe, paystack
  paymentIntentId: varchar('payment_intent_id', { length: 255 }),
  message: text('message'), // optional donor message
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
  // Enhanced status tracking fields
  retryAttempts: integer('retry_attempts').default(0).notNull(),
  failureReason: varchar('failure_reason', { length: 255 }),
  lastStatusUpdate: timestamp('last_status_update').defaultNow().notNull(),
  providerStatus: varchar('provider_status', { length: 50 }), // Original provider status
  providerError: text('provider_error'), // Provider error message
});

// Relations will be defined later to avoid circular dependencies

export type Donation = typeof donations.$inferSelect;
export type NewDonation = typeof donations.$inferInsert; 