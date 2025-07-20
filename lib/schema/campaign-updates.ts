import { pgTable, uuid, varchar, timestamp, text, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const campaignUpdates = pgTable('campaign_updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  isPublic: boolean('is_public').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations will be defined later to avoid circular dependencies

export type CampaignUpdate = typeof campaignUpdates.$inferSelect;
export type NewCampaignUpdate = typeof campaignUpdates.$inferInsert; 