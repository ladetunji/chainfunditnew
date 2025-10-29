#!/usr/bin/env tsx

/**
 * Setup Admin Notifications Script
 * 
 * This script creates default admin notification settings for all existing admin users
 * who don't already have settings configured.
 * 
 * Usage: npm run setup-admin-notifications
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

async function setupAdminNotifications() {
  try {
    console.log('🔍 Finding admin users...');
    
    // Get all admin users
    const adminUsers = await db.query.users.findMany({
      where: or(
        eq(users.role, 'admin'),
        eq(users.role, 'super_admin')
      ),
    });

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in the system');
      console.log('   Please create admin users first before running this script');
      return;
    }

    console.log(`✅ Found ${adminUsers.length} admin user(s):`);
    adminUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });

    // Check existing admin settings
    const existingSettings = await db.query.adminSettings.findMany();
    const existingUserIds = new Set(existingSettings.map(s => s.userId));

    console.log('\n🔍 Checking existing admin settings...');
    
    let settingsCreated = 0;
    let settingsUpdated = 0;

    for (const adminUser of adminUsers) {
      if (existingUserIds.has(adminUser.id)) {
        console.log(`   ⚠️  Settings already exist for ${adminUser.email}`);
        continue;
      }

      // Create default settings for this admin
      const [newSettings] = await db
        .insert(adminSettings)
        .values({
          userId: adminUser.id,
          emailNotificationsEnabled: true,
          notifyOnCharityDonation: true,
          notifyOnCampaignDonation: true,
          notifyOnPayoutRequest: true,
          notifyOnLargeDonation: true,
          notifyOnAccountChangeRequest: true,
          largeDonationThreshold: '1000',
          pushNotificationsEnabled: false,
          dailySummaryEnabled: false,
          weeklySummaryEnabled: true,
          summaryTime: '09:00',
        })
        .returning();

      console.log(`   ✅ Created settings for ${adminUser.email}`);
      settingsCreated++;
    }

    console.log('\n📊 Summary:');
    console.log(`   - Admin users found: ${adminUsers.length}`);
    console.log(`   - Settings created: ${settingsCreated}`);
    console.log(`   - Settings already existed: ${adminUsers.length - settingsCreated}`);

    if (settingsCreated > 0) {
      console.log('\n🎉 Admin notification setup completed successfully!');
      console.log('   Admin users will now receive notifications for:');
      console.log('   - Payout requests');
      console.log('   - Charity donations');
      console.log('   - Campaign donations');
      console.log('   - Large donations (above $1000)');
      console.log('   - Account change requests');
      console.log('\n   Admins can customize these settings at: /admin/settings');
    } else {
      console.log('\n✅ All admin users already have notification settings configured');
    }

  } catch (error) {
    console.error('❌ Error setting up admin notifications:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run the script
setupAdminNotifications();
