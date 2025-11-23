import { pgTable, uuid, varchar, timestamp, text, jsonb, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { campaigns } from './campaigns';

export const campaignScreenings = pgTable('campaign_screenings', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  jobType: varchar('job_type', { length: 30 }).default('initial').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, processing, completed, failed
  syncFindings: jsonb('sync_findings'),
  asyncFindings: jsonb('async_findings'),
  decision: varchar('decision', { length: 20 }),
  riskScore: decimal('risk_score', { precision: 5, scale: 2 }).default('0').notNull(),
  failureReason: text('failure_reason'),
  lockedAt: timestamp('locked_at'),
  lockedBy: varchar('locked_by', { length: 100 }),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const campaignScreeningsRelations = relations(campaignScreenings, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignScreenings.campaignId],
    references: [campaigns.id],
  }),
}));

export type CampaignScreening = typeof campaignScreenings.$inferSelect;
export type NewCampaignScreening = typeof campaignScreenings.$inferInsert;

