import { pgTable, uuid, varchar, timestamp, decimal, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const commissionPayouts = pgTable('commission_payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  chainerId: uuid('chainer_id').notNull(),
  campaignId: uuid('campaign_id').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  destination: varchar('destination', { length: 20 }).notNull(), // keep, donate_back, donate_other
  destinationCampaignId: uuid('destination_campaign_id'), // if donate_other
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, completed, failed
  transactionId: varchar('transaction_id', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
});

// Relations will be defined later to avoid circular dependencies

export type CommissionPayout = typeof commissionPayouts.$inferSelect;
export type NewCommissionPayout = typeof commissionPayouts.$inferInsert; 