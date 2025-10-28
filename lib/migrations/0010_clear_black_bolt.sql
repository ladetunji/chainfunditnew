ALTER TABLE "chainers" ADD COLUMN "status" varchar(20) DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "chainers" ADD COLUMN "commission_rate" numeric(5, 2) DEFAULT '5.0' NOT NULL;--> statement-breakpoint
ALTER TABLE "chainers" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "chainers" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "chainers" ADD COLUMN "suspended_at" timestamp;--> statement-breakpoint
ALTER TABLE "chainers" ADD COLUMN "suspended_reason" text;--> statement-breakpoint
ALTER TABLE "chainers" ADD COLUMN "last_activity" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_backup_codes" text;