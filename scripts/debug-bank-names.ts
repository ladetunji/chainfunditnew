#!/usr/bin/env tsx

/**
 * Debug Bank Names Script
 * 
 * This script helps debug bank name issues by checking:
 * 1. Users with missing bank names
 * 2. Bank code to name mapping
 * 3. Account verification status
 * 
 * Usage: npm run debug-bank-names
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';

// Try to load .env.local first, then .env
const envPath = resolve(process.cwd(), '.env.local');
config({ path: envPath });
config({ path: resolve(process.cwd(), '.env') });

import { db } from '../lib/db';
import { users } from '../lib/schema';
import { eq } from 'drizzle-orm';

async function debugBankNames() {
  try {
    // Get all users with account verification
    const verifiedUsers = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        accountNumber: users.accountNumber,
        bankCode: users.bankCode,
        bankName: users.bankName,
        accountName: users.accountName,
        accountVerified: users.accountVerified,
      })
      .from(users)
      .where(eq(users.accountVerified, true));


    if (verifiedUsers.length === 0) {
      return;
    }

    // Check for missing bank names
    const usersWithMissingBankNames = verifiedUsers.filter(user => 
      !user.bankName || user.bankName.trim() === ''
    );

    
    if (usersWithMissingBankNames.length > 0) {
      usersWithMissingBankNames.forEach(user => {
      });
    }

    // Check for users with bank codes but no bank names
    const usersWithBankCodeButNoName = verifiedUsers.filter(user => 
      user.bankCode && (!user.bankName || user.bankName.trim() === '')
    );

    
    if (usersWithBankCodeButNoName.length > 0) {
      usersWithBankCodeButNoName.forEach(user => {
      });
    }

    // Show all verified users for reference
    verifiedUsers.forEach(user => {
    });

  } catch (error) {
    process.exit(1);
  }
}

// Run the script
debugBankNames();
