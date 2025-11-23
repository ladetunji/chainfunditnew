import { pgTable, uuid, varchar, timestamp, text, boolean, index, decimal, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  countryCode: varchar('country_code', { length: 5 }),
  avatar: text('avatar'),
  isVerified: boolean('is_verified').default(false),
  hasCompletedProfile: boolean('has_completed_profile').default(false),
  hasSeenWelcomeModal: boolean('has_seen_welcome_modal').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  instagram: varchar('instagram', { length: 255 }),
  facebook: varchar('facebook', { length: 255 }),
  linkedin: varchar('linkedin', { length: 255 }),
  twitter: varchar('twitter', { length: 255 }),
  tiktok: varchar('tiktok', { length: 255 }),
  youtube: varchar('youtube', { length: 255 }),
  bio: text('bio'),
  // Account details for payouts
  accountNumber: varchar('account_number', { length: 20 }),
  bankCode: varchar('bank_code', { length: 10 }),
  bankName: varchar('bank_name', { length: 100 }),
  accountName: varchar('account_name', { length: 255 }),
  accountVerified: boolean('account_verified').default(false),
  accountVerificationDate: timestamp('account_verification_date'),
  accountLocked: boolean('account_locked').default(false),
  accountChangeRequested: boolean('account_change_requested').default(false),
  accountChangeReason: text('account_change_reason'),
  role: varchar('role', { length: 20 }).default('user'),
  kycStatus: varchar('kyc_status', { length: 30 }).default('not_started').notNull(),
  kycProvider: varchar('kyc_provider', { length: 50 }),
  kycReference: varchar('kyc_reference', { length: 255 }),
  kycExternalId: varchar('kyc_external_id', { length: 255 }),
  kycRiskScore: decimal('kyc_risk_score', { precision: 5, scale: 2 }),
  kycLastCheckedAt: timestamp('kyc_last_checked_at'),
  kycPayload: jsonb('kyc_payload'),
  // 2FA fields
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  twoFactorSecret: text('two_factor_secret'),
  twoFactorBackupCodes: text('two_factor_backup_codes'),
  // Stripe Connect fields (deprecated for foreign currencies - now using bank accounts)
  stripeAccountId: varchar('stripe_account_id', { length: 255 }),
  stripeAccountReady: boolean('stripe_account_ready').default(false),
  stripeAccountOnboardedAt: timestamp('stripe_account_onboarded_at'),
  // International bank account details for foreign currency payouts (via Stripe)
  internationalBankAccountNumber: varchar('international_bank_account_number', { length: 50 }), // IBAN
  internationalBankRoutingNumber: varchar('international_bank_routing_number', { length: 50 }), // Routing/Sort Code
  internationalBankSwiftBic: varchar('international_bank_swift_bic', { length: 20 }), // SWIFT/BIC code
  internationalBankCountry: varchar('international_bank_country', { length: 5 }), // Country code (US, GB, etc.)
  internationalBankName: varchar('international_bank_name', { length: 255 }), // Bank name (e.g., "Sterling Bank UK", "Citi Bank US")
  internationalAccountName: varchar('international_account_name', { length: 255 }), // Account holder name
  internationalAccountVerified: boolean('international_account_verified').default(false),
  internationalAccountVerificationDate: timestamp('international_account_verification_date'),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  phoneIdx: index('users_phone_idx').on(table.phone),
  verifiedIdx: index('users_verified_idx').on(table.isVerified),
  accountNumberIdx: index('users_account_number_idx').on(table.accountNumber),
  accountVerifiedIdx: index('users_account_verified_idx').on(table.accountVerified),
  accountLockedIdx: index('users_account_locked_idx').on(table.accountLocked),
  roleIdx: index('users_role_idx').on(table.role),
}));

// Relations will be defined later to avoid circular dependencies

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;