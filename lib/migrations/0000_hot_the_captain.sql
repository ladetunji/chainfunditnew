CREATE TABLE "campaign_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"url" text NOT NULL,
	"alt_text" varchar(255),
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"goal_amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"minimum_donation" numeric(10, 2) NOT NULL,
	"chainer_commission_rate" numeric(3, 1) NOT NULL,
	"current_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "chainers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"referral_code" varchar(50) NOT NULL,
	"commission_destination" varchar(20) DEFAULT 'keep' NOT NULL,
	"charity_choice_id" uuid,
	"total_raised" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_referrals" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"commission_earned" numeric(10, 2) DEFAULT '0' NOT NULL,
	"commission_paid" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chainers_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "commission_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chainer_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"destination" varchar(20) NOT NULL,
	"destination_campaign_id" uuid,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"transaction_id" varchar(255),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"donor_id" uuid NOT NULL,
	"chainer_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"payment_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"payment_intent_id" varchar(255),
	"message" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"country_code" varchar(5),
	"avatar" text,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "link_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chainer_id" uuid NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"referrer" text,
	"clicked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" uuid NOT NULL,
	"referred_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"referral_code" varchar(50) NOT NULL,
	"is_converted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"donation_id" uuid NOT NULL,
	"provider" varchar(20) NOT NULL,
	"provider_transaction_id" varchar(255) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"status" varchar(20) NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);
