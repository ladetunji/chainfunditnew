import { pgTable, uuid, varchar, timestamp, decimal, integer, boolean, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const chainers = pgTable('chainers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  campaignId: uuid('campaign_id').notNull(),
  referralCode: varchar('referral_code', { length: 50 }).notNull().unique(),
  commissionDestination: varchar('commission_destination', { length: 20 }).default('keep').notNull(), // keep, donate_back, donate_other
  charityChoiceId: uuid('charity_choice_id'), // if donate_other, which charity
  totalRaised: decimal('total_raised', { precision: 10, scale: 2 }).default('0').notNull(),
  totalReferrals: integer('total_referrals').default(0).notNull(),
  clicks: integer('clicks').default(0).notNull(),
  conversions: integer('conversions').default(0).notNull(),
  commissionEarned: decimal('commission_earned', { precision: 10, scale: 2 }).default('0').notNull(),
  commissionPaid: boolean('commission_paid').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations will be defined later to avoid circular dependencies

export type Chainer = typeof chainers.$inferSelect;
export type NewChainer = typeof chainers.$inferInsert; 