import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const referrals = pgTable('referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  referrerId: uuid('referrer_id').notNull(), // chainer
  referredId: uuid('referred_id').notNull(), // new user
  campaignId: uuid('campaign_id').notNull(),
  referralCode: varchar('referral_code', { length: 50 }).notNull(),
  isConverted: boolean('is_converted').default(false).notNull(), // did they donate?
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations will be defined later to avoid circular dependencies

export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert; 