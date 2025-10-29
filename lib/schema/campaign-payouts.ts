import { pgTable, uuid, varchar, timestamp, decimal, text, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { campaigns } from './campaigns';
import { users } from './users';

// Campaign Payout Requests - tracks payout requests from campaign creators
export const campaignPayouts = pgTable('campaign_payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  
  // Payout Amounts
  requestedAmount: decimal('requested_amount', { precision: 12, scale: 2 }).notNull(),
  grossAmount: decimal('gross_amount', { precision: 12, scale: 2 }).notNull(), // Total raised
  fees: decimal('fees', { precision: 12, scale: 2 }).notNull(), // Platform fees
  netAmount: decimal('net_amount', { precision: 12, scale: 2 }).notNull(), // Amount after fees
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  
  // Payout Details
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, approved, rejected, processing, completed, failed
  payoutProvider: varchar('payout_provider', { length: 50 }).notNull(), // stripe, paystack, etc.
  reference: varchar('reference', { length: 255 }), // Internal reference ID
  
  // Banking Details Used for Payout
  bankName: varchar('bank_name', { length: 255 }),
  accountNumber: varchar('account_number', { length: 100 }),
  accountName: varchar('account_name', { length: 255 }),
  bankCode: varchar('bank_code', { length: 10 }),
  
  // Admin Management
  notes: text('notes'), // Admin notes
  rejectionReason: text('rejection_reason'), // If rejected
  approvedBy: uuid('approved_by'), // Admin user who approved
  approvedAt: timestamp('approved_at'),
  
  // Processing
  transactionId: varchar('transaction_id', { length: 255 }), // External payment processor transaction ID
  failureReason: text('failure_reason'),
  retryAttempts: decimal('retry_attempts', { precision: 2, scale: 0 }).default('0').notNull(),
  
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const campaignPayoutsRelations = relations(campaignPayouts, ({ one }) => ({
  user: one(users, {
    fields: [campaignPayouts.userId],
    references: [users.id],
  }),
  campaign: one(campaigns, {
    fields: [campaignPayouts.campaignId],
    references: [campaigns.id],
  }),
}));

export type CampaignPayout = typeof campaignPayouts.$inferSelect;
export type NewCampaignPayout = typeof campaignPayouts.$inferInsert;

