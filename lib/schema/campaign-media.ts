import { pgTable, uuid, varchar, timestamp, text, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const campaignMedia = pgTable('campaign_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull(),
  type: varchar('type', { length: 20 }).notNull(), // image, video
  url: text('url').notNull(),
  altText: varchar('alt_text', { length: 255 }),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations will be defined later to avoid circular dependencies

export type CampaignMedia = typeof campaignMedia.$inferSelect;
export type NewCampaignMedia = typeof campaignMedia.$inferInsert; 