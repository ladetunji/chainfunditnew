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
    console.log('🔍 Debugging bank name issues...\n');
    
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

    console.log(`📊 Found ${verifiedUsers.length} verified users\n`);

    if (verifiedUsers.length === 0) {
      console.log('❌ No verified users found');
      return;
    }

    // Check for missing bank names
    const usersWithMissingBankNames = verifiedUsers.filter(user => 
      !user.bankName || user.bankName.trim() === ''
    );

    console.log(`⚠️  Users with missing bank names: ${usersWithMissingBankNames.length}`);
    
    if (usersWithMissingBankNames.length > 0) {
      console.log('\n📋 Users with missing bank names:');
      usersWithMissingBankNames.forEach(user => {
        console.log(`   - ${user.email} (${user.fullName})`);
        console.log(`     Bank Code: ${user.bankCode || 'N/A'}`);
        console.log(`     Bank Name: ${user.bankName || 'N/A'}`);
        console.log(`     Account: ${user.accountNumber || 'N/A'}`);
        console.log('');
      });
    }

    // Check for users with bank codes but no bank names
    const usersWithBankCodeButNoName = verifiedUsers.filter(user => 
      user.bankCode && (!user.bankName || user.bankName.trim() === '')
    );

    console.log(`🔍 Users with bank code but no bank name: ${usersWithBankCodeButNoName.length}`);
    
    if (usersWithBankCodeButNoName.length > 0) {
      console.log('\n📋 Users with bank code but no bank name:');
      usersWithBankCodeButNoName.forEach(user => {
        console.log(`   - ${user.email} (${user.fullName})`);
        console.log(`     Bank Code: ${user.bankCode}`);
        console.log(`     Bank Name: ${user.bankName || 'N/A'}`);
        console.log('');
      });
    }

    // Show all verified users for reference
    console.log('\n📋 All verified users:');
    verifiedUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.fullName})`);
      console.log(`     Bank Code: ${user.bankCode || 'N/A'}`);
      console.log(`     Bank Name: ${user.bankName || 'N/A'}`);
      console.log(`     Account: ${user.accountNumber || 'N/A'}`);
      console.log('');
    });

    console.log('✅ Bank name debugging completed');

  } catch (error) {
    console.error('❌ Error debugging bank names:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run the script
debugBankNames();
