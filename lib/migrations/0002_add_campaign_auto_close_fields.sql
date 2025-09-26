-- Add auto-close logic fields to campaigns table
ALTER TABLE "campaigns" ADD COLUMN "goal_reached_at" timestamp;
ALTER TABLE "campaigns" ADD COLUMN "auto_close_at" timestamp;
ALTER TABLE "campaigns" ADD COLUMN "expires_at" timestamp;

-- Update status enum to include 'expired'
-- Note: PostgreSQL doesn't support ALTER TYPE with ADD VALUE in a transaction
-- This will be handled by the application logic for now

-- Add indexes for performance
CREATE INDEX "idx_campaigns_status" ON "campaigns" ("status");
CREATE INDEX "idx_campaigns_auto_close_at" ON "campaigns" ("auto_close_at");
CREATE INDEX "idx_campaigns_expires_at" ON "campaigns" ("expires_at");
CREATE INDEX "idx_campaigns_goal_reached_at" ON "campaigns" ("goal_reached_at");
