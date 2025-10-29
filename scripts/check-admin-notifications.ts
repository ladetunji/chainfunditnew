#!/usr/bin/env tsx

/**
 * Admin Notification Diagnostic Script
 * 
 * This script checks if admin notifications are properly configured
 * and helps diagnose why notifications might not be working.
 * 
 * Usage: npm run check-admin-notifications
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
import { adminSettings } from '../lib/schema/admin-settings';
import { eq, or } from 'drizzle-orm';

async function checkAdminNotifications() {
  try {
    console.log('🔍 Checking admin notification configuration...\n');
    
    // Check environment variables
    console.log('1️⃣ Environment Variables:');
    console.log(`   RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || '❌ Not set'}`);
    console.log(`   RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL || '⚠️ Using default'}`);
    console.log('');
    
    // Get all admin users
    console.log('2️⃣ Admin Users:');
    const adminUsers = await db.query.users.findMany({
      where: or(
        eq(users.role, 'admin'),
        eq(users.role, 'super_admin')
      ),
    });

    if (adminUsers.length === 0) {
      console.log('   ❌ No admin users found in the system');
      console.log('   Please create admin users first');
      return;
    }

    console.log(`   Found ${adminUsers.length} admin user(s):`);
    adminUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });
    console.log('');

    // Check admin settings
    console.log('3️⃣ Admin Settings:');
    const allSettings = await db.query.adminSettings.findMany();
    console.log(`   Total admin settings records: ${allSettings.length}`);

    if (allSettings.length === 0) {
      console.log('   ⚠️ No admin settings found - notifications will use defaults');
      console.log('   Run: npm run setup-admin-notifications');
    } else {
      allSettings.forEach(setting => {
        const adminUser = adminUsers.find(u => u.id === setting.userId);
        console.log(`   Settings for ${adminUser?.email || 'Unknown User'}:`);
        console.log(`     - Email notifications: ${setting.emailNotificationsEnabled ? '✅ Enabled' : '❌ Disabled'}`);
        console.log(`     - Payout notifications: ${setting.notifyOnPayoutRequest ? '✅ Enabled' : '❌ Disabled'}`);
        console.log(`     - Notification email: ${setting.notificationEmail || 'Using ADMIN_EMAIL'}`);
        console.log('');
      });
    }

    // Check for potential issues
    console.log('4️⃣ Potential Issues:');
    let issuesFound = 0;

    if (!process.env.RESEND_API_KEY) {
      console.log('   ❌ RESEND_API_KEY is missing - emails cannot be sent');
      issuesFound++;
    }

    if (!process.env.ADMIN_EMAIL) {
      console.log('   ⚠️ ADMIN_EMAIL is not set - will need notificationEmail in admin settings');
      issuesFound++;
    }

    if (adminUsers.length > 0 && allSettings.length === 0) {
      console.log('   ⚠️ Admin users exist but no settings configured');
      console.log('   → Run: npm run setup-admin-notifications');
      issuesFound++;
    }

    // Check each admin user
    for (const adminUser of adminUsers) {
      const setting = allSettings.find(s => s.userId === adminUser.id);
      
      if (!setting) {
        console.log(`   ⚠️ Admin ${adminUser.email} has no settings - will use defaults`);
        continue;
      }

      if (!setting.emailNotificationsEnabled) {
        console.log(`   ⚠️ Admin ${adminUser.email} has email notifications disabled`);
        continue;
      }

      if (!setting.notifyOnPayoutRequest) {
        console.log(`   ⚠️ Admin ${adminUser.email} has payout notifications disabled`);
        continue;
      }

      const recipientEmail = setting.notificationEmail || process.env.ADMIN_EMAIL;
      if (!recipientEmail) {
        console.log(`   ❌ Admin ${adminUser.email} has no recipient email configured`);
        issuesFound++;
      }
    }

    if (issuesFound === 0) {
      console.log('   ✅ No issues found! Admin notifications should work correctly.');
    } else {
      console.log(`\n   Found ${issuesFound} issue(s) that need to be fixed`);
    }

    console.log('\n✅ Diagnostic check completed');

  } catch (error) {
    console.error('❌ Error checking admin notifications:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run the script
checkAdminNotifications();
