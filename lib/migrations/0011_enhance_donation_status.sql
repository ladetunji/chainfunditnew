-- Add enhanced donation status tracking fields
ALTER TABLE "donations" ADD COLUMN "retry_attempts" integer DEFAULT 0 NOT NULL;
ALTER TABLE "donations" ADD COLUMN "failure_reason" varchar(255);
ALTER TABLE "donations" ADD COLUMN "last_status_update" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "donations" ADD COLUMN "provider_status" varchar(50);
ALTER TABLE "donations" ADD COLUMN "provider_error" text;

-- Update existing donations to have last_status_update set to created_at
UPDATE "donations" SET "last_status_update" = "created_at" WHERE "last_status_update" IS NULL;

-- Add index for better query performance
CREATE INDEX "donations_status_idx" ON "donations" ("payment_status", "last_status_update");
CREATE INDEX "donations_retry_idx" ON "donations" ("retry_attempts", "last_status_update");
