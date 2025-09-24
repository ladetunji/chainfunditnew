import { pgTable, uuid, varchar, timestamp, text, decimal, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  subtitle: varchar('subtitle', { length: 255 }),
  description: text('description').notNull(),
  reason: varchar('reason', { length: 100 }),
  fundraisingFor: varchar('fundraising_for', { length: 100 }),
  duration: varchar('duration', { length: 50 }),
  videoUrl: varchar('video_url', { length: 255 }),
  coverImageUrl: varchar('cover_image_url', { length: 255 }),
  galleryImages: text('gallery_images'), // JSON stringified array
  documents: text('documents'), // JSON stringified array
  goalAmount: decimal('goal_amount', { precision: 15, scale: 2 }).notNull(), // Increased precision for larger amounts
  currency: varchar('currency', { length: 50 }).notNull(), // Increased length for longer currency names
  minimumDonation: decimal('minimum_donation', { precision: 15, scale: 2 }).notNull(),
  chainerCommissionRate: decimal('chainer_commission_rate', { precision: 3, scale: 1 }).notNull(), // 1.0-10.0
  isChained: boolean('is_chained').default(false).notNull(), // Whether campaign allows chaining
  currentAmount: decimal('current_amount', { precision: 15, scale: 2 }).default('0').notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(), // active, paused, goal_reached, closed
  visibility: varchar('visibility', { length: 20 }).default('public').notNull(), // public, private
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
});


// Relations will be defined later to avoid circular dependencies

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;