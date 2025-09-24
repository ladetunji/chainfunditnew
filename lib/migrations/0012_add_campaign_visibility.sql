-- Add visibility field to campaigns table
ALTER TABLE "campaigns" ADD COLUMN "visibility" varchar(20) DEFAULT 'public' NOT NULL;

-- Update existing campaigns to have public visibility
UPDATE "campaigns" SET "visibility" = 'public' WHERE "visibility" IS NULL;

-- Add index for better query performance on visibility
CREATE INDEX "campaigns_visibility_idx" ON "campaigns" ("visibility", "is_active");
