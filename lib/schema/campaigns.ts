import { pgTable, uuid, varchar, timestamp, text, decimal, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  goalAmount: decimal('goal_amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(), // USD, GBP, NGN
  minimumDonation: decimal('minimum_donation', { precision: 10, scale: 2 }).notNull(),
  chainerCommissionRate: decimal('chainer_commission_rate', { precision: 3, scale: 1 }).notNull(), // 1.0-10.0
  currentAmount: decimal('current_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(), // active, paused, goal_reached, closed
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
});

// Relations will be defined later to avoid circular dependencies

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert; 