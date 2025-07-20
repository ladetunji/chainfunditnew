import { pgTable, uuid, varchar, timestamp, text, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const campaignComments = pgTable('campaign_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull(),
  userId: uuid('user_id').notNull(),
  content: text('content').notNull(),
  isPublic: boolean('is_public').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations will be defined later to avoid circular dependencies

export type CampaignComment = typeof campaignComments.$inferSelect;
export type NewCampaignComment = typeof campaignComments.$inferInsert; 