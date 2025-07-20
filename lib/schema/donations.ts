import { pgTable, uuid, varchar, timestamp, decimal, text, boolean } from 'drizzle-orm/pg-core';
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
});

// Relations will be defined later to avoid circular dependencies

export type Donation = typeof donations.$inferSelect;
export type NewDonation = typeof donations.$inferInsert; 