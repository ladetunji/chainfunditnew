import { pgTable, uuid, text, boolean, timestamp, varchar, integer, numeric, unique, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const campaignComments = pgTable("campaign_comments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	campaignId: uuid("campaign_id").notNull(),
	userId: uuid("user_id").notNull(),
	content: text().notNull(),
	isPublic: boolean("is_public").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const campaignMedia = pgTable("campaign_media", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	campaignId: uuid("campaign_id").notNull(),
	type: varchar({ length: 20 }).notNull(),
	url: text().notNull(),
	altText: varchar("alt_text", { length: 255 }),
	order: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const campaignUpdates = pgTable("campaign_updates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	campaignId: uuid("campaign_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	isPublic: boolean("is_public").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const campaigns = pgTable("campaigns", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	creatorId: uuid("creator_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	goalAmount: numeric("goal_amount", { precision: 15, scale:  2 }).notNull(),
	currency: varchar({ length: 50 }).notNull(),
	minimumDonation: numeric("minimum_donation", { precision: 15, scale:  2 }).notNull(),
	chainerCommissionRate: numeric("chainer_commission_rate", { precision: 3, scale:  1 }).notNull(),
	currentAmount: numeric("current_amount", { precision: 15, scale:  2 }).default('0').notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	closedAt: timestamp("closed_at", { mode: 'string' }),
	subtitle: varchar({ length: 255 }),
	reason: varchar({ length: 100 }),
	fundraisingFor: varchar("fundraising_for", { length: 100 }),
	duration: varchar({ length: 50 }),
	videoUrl: varchar("video_url", { length: 255 }),
	coverImageUrl: varchar("cover_image_url", { length: 255 }),
	galleryImages: text("gallery_images"),
	documents: text(),
});

export const chainers = pgTable("chainers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	campaignId: uuid("campaign_id").notNull(),
	referralCode: varchar("referral_code", { length: 50 }).notNull(),
	commissionDestination: varchar("commission_destination", { length: 20 }).default('keep').notNull(),
	charityChoiceId: uuid("charity_choice_id"),
	totalRaised: numeric("total_raised", { precision: 10, scale:  2 }).default('0').notNull(),
	totalReferrals: integer("total_referrals").default(0).notNull(),
	clicks: integer().default(0).notNull(),
	conversions: integer().default(0).notNull(),
	commissionEarned: numeric("commission_earned", { precision: 10, scale:  2 }).default('0').notNull(),
	commissionPaid: boolean("commission_paid").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("chainers_referral_code_unique").on(table.referralCode),
]);

export const commissionPayouts = pgTable("commission_payouts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chainerId: uuid("chainer_id").notNull(),
	campaignId: uuid("campaign_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	destination: varchar({ length: 20 }).notNull(),
	destinationCampaignId: uuid("destination_campaign_id"),
	status: varchar({ length: 20 }).default('pending').notNull(),
	transactionId: varchar("transaction_id", { length: 255 }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	processedAt: timestamp("processed_at", { mode: 'string' }),
});

export const donations = pgTable("donations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	campaignId: uuid("campaign_id").notNull(),
	donorId: uuid("donor_id").notNull(),
	chainerId: uuid("chainer_id"),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	currency: varchar({ length: 3 }).notNull(),
	paymentStatus: varchar("payment_status", { length: 20 }).default('pending').notNull(),
	paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
	paymentIntentId: varchar("payment_intent_id", { length: 255 }),
	message: text(),
	isAnonymous: boolean("is_anonymous").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	retryAttempts: integer("retry_attempts").default(0).notNull(),
	failureReason: varchar("failure_reason", { length: 255 }),
	lastStatusUpdate: timestamp("last_status_update", { mode: 'string' }).defaultNow().notNull(),
	providerStatus: varchar("provider_status", { length: 50 }),
	providerError: text("provider_error"),
});

export const linkClicks = pgTable("link_clicks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chainerId: uuid("chainer_id").notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	referrer: text(),
	clickedAt: timestamp("clicked_at", { mode: 'string' }).defaultNow().notNull(),
});

export const referrals = pgTable("referrals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	referrerId: uuid("referrer_id").notNull(),
	referredId: uuid("referred_id").notNull(),
	campaignId: uuid("campaign_id").notNull(),
	referralCode: varchar("referral_code", { length: 50 }).notNull(),
	isConverted: boolean("is_converted").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	donationId: uuid("donation_id").notNull(),
	provider: varchar({ length: 20 }).notNull(),
	providerTransactionId: varchar("provider_transaction_id", { length: 255 }).notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	currency: varchar({ length: 3 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	metadata: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	processedAt: timestamp("processed_at", { mode: 'string' }),
});

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	phone: varchar({ length: 20 }),
	countryCode: varchar("country_code", { length: 5 }),
	avatar: text(),
	isVerified: boolean("is_verified").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	hasCompletedProfile: boolean("has_completed_profile").default(false),
	instagram: varchar({ length: 255 }),
	facebook: varchar({ length: 255 }),
	linkedin: varchar({ length: 255 }),
	twitter: varchar({ length: 255 }),
	tiktok: varchar({ length: 255 }),
	youtube: varchar({ length: 255 }),
	bio: text(),
	hasSeenWelcomeModal: boolean("has_seen_welcome_modal").default(false),
}, (table) => [
	index("users_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("users_phone_idx").using("btree", table.phone.asc().nullsLast().op("text_ops")),
	index("users_verified_idx").using("btree", table.isVerified.asc().nullsLast().op("bool_ops")),
	unique("users_email_unique").on(table.email),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	isRead: boolean("is_read").default(false).notNull(),
	metadata: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	readAt: timestamp("read_at", { mode: 'string' }),
});

export const emailOtps = pgTable("email_otps", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	otp: varchar({ length: 10 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("email_otps_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("email_otps_email_otp_idx").using("btree", table.email.asc().nullsLast().op("text_ops"), table.otp.asc().nullsLast().op("text_ops")),
	index("email_otps_expires_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
]);

export const phoneOtps = pgTable("phone_otps", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	phone: varchar({ length: 20 }).notNull(),
	otp: varchar({ length: 10 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: varchar({ length: 255 }).notNull(),
	provider: varchar({ length: 255 }).notNull(),
	providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: varchar("token_type", { length: 255 }),
	scope: varchar({ length: 255 }),
	idToken: text("id_token"),
	sessionState: varchar("session_state", { length: 255 }),
});

export const sessions = pgTable("sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionToken: varchar("session_token", { length: 255 }).notNull(),
	userId: uuid("user_id").notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	unique("sessions_session_token_unique").on(table.sessionToken),
]);

export const verificationTokens = pgTable("verification_tokens", {
	identifier: varchar({ length: 255 }).notNull(),
	token: varchar({ length: 255 }).notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	unique("verification_tokens_token_unique").on(table.token),
]);
