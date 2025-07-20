import { pgTable, uuid, varchar, timestamp, text, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // donation_received, campaign_update, etc.
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  metadata: text('metadata'), // JSON string for additional data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  readAt: timestamp('read_at'),
});

// Relations will be defined later to avoid circular dependencies

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert; 