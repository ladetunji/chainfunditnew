import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const linkClicks = pgTable('link_clicks', {
  id: uuid('id').primaryKey().defaultRandom(),
  chainerId: uuid('chainer_id').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  clickedAt: timestamp('clicked_at').defaultNow().notNull(),
});

// Relations will be defined later to avoid circular dependencies

export type LinkClick = typeof linkClicks.$inferSelect;
export type NewLinkClick = typeof linkClicks.$inferInsert; 