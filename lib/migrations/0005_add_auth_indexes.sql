-- Add indexes for better authentication performance
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "users_phone_idx" ON "users" ("phone");
CREATE INDEX IF NOT EXISTS "users_verified_idx" ON "users" ("is_verified");

CREATE INDEX IF NOT EXISTS "email_otps_email_idx" ON "email_otps" ("email");
CREATE INDEX IF NOT EXISTS "email_otps_expires_idx" ON "email_otps" ("expires_at");
CREATE INDEX IF NOT EXISTS "email_otps_email_otp_idx" ON "email_otps" ("email", "otp");
