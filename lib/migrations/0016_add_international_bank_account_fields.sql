-- Add international bank account fields to users table for foreign currency payouts
ALTER TABLE users ADD COLUMN IF NOT EXISTS international_bank_account_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS international_bank_routing_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS international_bank_swift_bic VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS international_bank_country VARCHAR(5);
ALTER TABLE users ADD COLUMN IF NOT EXISTS international_bank_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS international_account_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS international_account_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS international_account_verification_date TIMESTAMP;

-- Add indexes for international bank account fields
CREATE INDEX IF NOT EXISTS users_international_account_verified_idx ON users(international_account_verified);
CREATE INDEX IF NOT EXISTS users_international_bank_country_idx ON users(international_bank_country);

