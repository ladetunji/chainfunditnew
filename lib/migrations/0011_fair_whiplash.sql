CREATE TABLE "campaign_screenings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"job_type" varchar(30) DEFAULT 'initial' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"sync_findings" jsonb,
	"async_findings" jsonb,
	"decision" varchar(20),
	"risk_score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"failure_reason" text,
	"locked_at" timestamp,
	"locked_by" varchar(100),
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_kyc_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(50) DEFAULT 'persona' NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"reference_id" varchar(255),
	"external_inquiry_id" varchar(255),
	"session_token" varchar(255),
	"risk_score" numeric(5, 2),
	"payload" jsonb,
	"failure_reason" text,
	"completed_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "compliance_status" varchar(30) DEFAULT 'pending_screening' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "compliance_summary" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "compliance_flags" jsonb;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "risk_score" numeric(5, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "review_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "last_screened_at" timestamp;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "blocked_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "kyc_status" varchar(30) DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "kyc_provider" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "kyc_reference" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "kyc_external_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "kyc_risk_score" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "kyc_last_checked_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "kyc_payload" jsonb;--> statement-breakpoint
ALTER TABLE "campaign_screenings" ADD CONSTRAINT "campaign_screenings_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_kyc_verifications" ADD CONSTRAINT "user_kyc_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;