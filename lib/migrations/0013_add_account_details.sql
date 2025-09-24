-- Add account details fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_verification_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_change_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_change_reason TEXT;

-- Add indexes for account fields
CREATE INDEX IF NOT EXISTS users_account_number_idx ON users(account_number);
CREATE INDEX IF NOT EXISTS users_account_verified_idx ON users(account_verified);
CREATE INDEX IF NOT EXISTS users_account_locked_idx ON users(account_locked);
