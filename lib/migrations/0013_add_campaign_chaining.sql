-- Add isChained field to campaigns table
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "is_chained" boolean DEFAULT false NOT NULL;

-- Update existing campaigns to have chaining disabled by default
UPDATE "campaigns" SET "is_chained" = false WHERE "is_chained" IS NULL;

-- Add index for better query performance on chaining
CREATE INDEX IF NOT EXISTS "campaigns_chaining_idx" ON "campaigns" ("is_chained", "is_active");
