import { pgTable, uuid, varchar, timestamp, decimal, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  donationId: uuid('donation_id').notNull(),
  provider: varchar('provider', { length: 20 }).notNull(), // stripe, paystack
  providerTransactionId: varchar('provider_transaction_id', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // pending, completed, failed, refunded
  metadata: text('metadata'), // JSON string for additional data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
});

// Relations will be defined later to avoid circular dependencies

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert; 